import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../config/database.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('Warning: GEMINI_API_KEY is not set in environment variables. AI Analytics functionality may not work.');
}

export const getAIAnalytics = async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key is not configured' });
    }

    const userId = req.user.id;

    // Get user's linked family ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { linkedFamilyId: true }
    });

    // Fetch data from both current user and linked family
    const userIds = [userId];
    if (user?.linkedFamilyId) {
      userIds.push(user.linkedFamilyId);
    }

    // Also check if any other user has linked to the current user (bidirectional)
    const usersLinkedToMe = await prisma.user.findMany({
      where: { linkedFamilyId: userId },
      select: { id: true }
    });
    
    usersLinkedToMe.forEach(u => {
      if (!userIds.includes(u.id)) {
        userIds.push(u.id);
      }
    });

    // First get family members to access related data (from all linked accounts)
    const family = await prisma.familyMember.findMany({ 
      where: { userId: { in: userIds } }
    });
    const familyMemberIds = family.map(f => f.id);

    // Gather health data for analysis (from all linked accounts)
    const [medications, reports, healthDataRecords, plans] = await Promise.all([
      prisma.medication.findMany({ where: { userId: { in: userIds } } }),
      prisma.report.findMany({ 
        where: { userId: { in: userIds } }, 
        take: 10, 
        orderBy: { date: 'desc' } 
      }),
      prisma.healthData.findMany({ 
        where: { familyMemberId: { in: familyMemberIds } }, 
        take: 20, 
        orderBy: { date: 'desc' } 
      }),
      prisma.plan.findMany({ 
        where: { familyMemberId: { in: familyMemberIds } },
        include: { familyMember: true }
      })
    ]);

    // Calculate medication adherence
    const totalMedications = medications.length;
    const activePlans = plans.length; // All plans are active by default
    
    // Group health data by type
    const healthDataByType = {};
    healthDataRecords.forEach(record => {
      if (!healthDataByType[record.type]) {
        healthDataByType[record.type] = [];
      }
      healthDataByType[record.type].push({
        value: record.value,
        date: record.date
      });
    });

    // Prepare data summary for AI
    const dataSummary = {
      totalMedications,
      totalFamilyMembers: family.length,
      totalReports: reports.length,
      activePlans,
      recentReports: reports.slice(0, 5).map(r => ({
        title: r.title,
        category: r.category,
        date: r.date
      })),
      healthDataTypes: Object.keys(healthDataByType),
      healthDataSummary: Object.entries(healthDataByType).map(([type, records]) => ({
        type,
        count: records.length,
        latestValue: records[0]?.value
      }))
    };

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    // Create prompt for health analytics
    const prompt = `Analyze the following family health data and provide insights:

Family Health Summary:
- Total Medications: ${dataSummary.totalMedications}
- Family Members: ${dataSummary.totalFamilyMembers}
- Health Reports: ${dataSummary.totalReports}
- Active Medication Plans: ${dataSummary.activePlans}

Recent Reports:
${dataSummary.recentReports.map(r => `- ${r.title} (${r.category}) on ${new Date(r.date).toLocaleDateString()}`).join('\n')}

Health Data Tracked:
${dataSummary.healthDataSummary.map(h => `- ${h.type}: ${h.count} records, latest: ${h.latestValue}`).join('\n')}

Please provide:
1. Overall health assessment (brief, 2-3 sentences)
2. Key recommendations (3-5 actionable items)
3. Areas of concern (if any)
4. Positive trends (if any)

Format your response as a JSON object with keys: assessment, recommendations (array), concerns (array), trends (array).`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiText = response.text();

    // Try to parse JSON from response
    let aiInsights;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiText.match(/```json\s*([\s\S]*?)\s*```/) || aiText.match(/```\s*([\s\S]*?)\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : aiText;
      aiInsights = JSON.parse(jsonText);
    } catch (e) {
      // Fallback: parse manually or use raw text
      aiInsights = {
        assessment: aiText.split('\n\n')[0] || aiText.substring(0, 200),
        recommendations: aiText.match(/recommendations?[:\-]\s*(.+?)(?:\n|$)/i)?.[1]?.split(/[•\-\n]/).filter(r => r.trim()).slice(0, 5) || [],
        concerns: [],
        trends: []
      };
    }

    res.json({
      success: true,
      data: {
        summary: dataSummary,
        aiInsights
      }
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate AI analytics', 
      message: error.message 
    });
  }
};

