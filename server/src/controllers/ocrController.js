import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('Warning: GEMINI_API_KEY is not set in environment variables. OCR functionality may not work.');
}

export const processOCR = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key is not configured' });
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    // Use gemini-2.5-flash-lite for fast multimodal (text + image) analysis
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    // Convert file to base64
    const imageBase64 = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    // Prepare the prompt for medical document OCR
    const prompt = `Analyze this medical document image and extract the following information:
1. Document title/type (e.g., Lab Report, Prescription, Medical Report)
2. Date (if visible)
3. Patient name (if visible)
4. Any relevant medical information

Return the extracted information in a structured format. If you cannot identify specific information, indicate that clearly.

Focus on:
- Document title/type
- Date
- Patient name
- Key medical details or medications mentioned`;

    // Process with Gemini Vision
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType
        }
      }
    ]);

    const response = await result.response;
    const extractedText = response.text();

    // Parse the response to extract structured data
    let extractedData = {
      title: null,
      date: null,
      patientName: null,
      extractedText: extractedText
    };

    // Try to extract title from the response
    const titleMatch = extractedText.match(/(?:title|document type|report type|type)[:]\s*(.+?)(?:\n|$)/i) ||
                      extractedText.match(/\b(Lab Report|Prescription|Medical Report|Health Report|Blood Test|X-Ray|MRI|CT Scan|Ultrasound)\b/i);
    if (titleMatch) {
      extractedData.title = (titleMatch[1] || titleMatch[0]).trim();
      // Clean up the title
      if (extractedData.title.length > 50) {
        extractedData.title = extractedData.title.substring(0, 50).trim();
      }
    }

    // Try to extract date
    const dateMatch = extractedText.match(/(?:date|dated)[:]\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i) ||
                     extractedText.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
    if (dateMatch) {
      extractedData.date = dateMatch[1];
    }

    // Try to extract patient name
    const nameMatch = extractedText.match(/(?:patient|name|patient name)[:]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
    if (nameMatch) {
      extractedData.patientName = nameMatch[1];
    }

    res.json({
      success: true,
      data: extractedData,
      fullText: extractedText
    });
  } catch (error) {
    console.error('OCR Error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to process OCR';
    if (error.message?.includes('404') || error.message?.includes('not found')) {
      errorMessage = 'Gemini model not found. Please check the model name and API key validity.';
    } else if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
      errorMessage = 'Invalid Gemini API key. Please check your API key configuration.';
    } else if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      errorMessage = 'API quota exceeded. Please try again later.';
    } else {
      errorMessage = error.message || 'Failed to process OCR';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

