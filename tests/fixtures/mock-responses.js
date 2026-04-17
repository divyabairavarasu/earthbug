// Minimal 1×1 white JPEG in base64 — used as a stand-in image during tests
export const TINY_IMAGE_BASE64 =
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8U' +
  'HRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgN' +
  'DRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy' +
  'MjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAA' +
  'AAAAAAAAAAAAAAAAAP/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAA' +
  'AAAA/9oADAMBAAIRAxEAPwCwABmX/9k=';

export const TINY_IMAGE_DATA_URL = `data:image/jpeg;base64,${TINY_IMAGE_BASE64}`;

// Well-formed successful Gemini API response (Garden Buddy)
export const MOCK_BUG_ANALYSIS = {
  name: 'Ladybug',
  scientificName: 'Coccinella septempunctata',
  verdict: 'Garden Buddy',
  confidence: 'high',
  summary: 'A beloved beetle known for devouring aphids and protecting gardens.',
  benefits: [
    {
      title: 'Aphid Control',
      description: 'Ladybugs consume hundreds of aphids per day, keeping pest populations in check naturally.',
    },
    {
      title: 'Pollinator Support',
      description: 'Adult ladybugs feed on pollen and nectar, supporting plant reproduction.',
    },
  ],
  harms: [
    {
      title: 'Occasional Overcrowding',
      description: 'In very high numbers they can become a nuisance indoors during overwintering.',
    },
  ],
  ecosystemRole:
    'Ladybugs are a key predatory insect in garden and agricultural ecosystems, controlling soft-bodied pests.',
  didYouKnow: 'A single ladybug can eat up to 5,000 aphids in its lifetime.',
  soilImpact: 'positive',
  plantImpact: 'positive',
};

// Gemini response when no bug is found in the image
export const MOCK_NO_BUG_RESPONSE = {
  error: true,
  message: "I couldn't spot a bug in that photo. Try getting closer or make sure the bug is visible!",
};

// Raw HTTP response envelope the SDK expects
export function buildGeminiHttpResponse(textContent) {
  return {
    candidates: [
      {
        content: {
          parts: [{ text: textContent }],
          role: 'model',
        },
        finishReason: 'STOP',
        index: 0,
      },
    ],
    promptFeedback: { safetyRatings: [] },
  };
}

// Pre-serialised payloads
export const SUCCESS_HTTP_BODY = buildGeminiHttpResponse(
  JSON.stringify(MOCK_BUG_ANALYSIS),
);

export const NO_BUG_HTTP_BODY = buildGeminiHttpResponse(
  JSON.stringify(MOCK_NO_BUG_RESPONSE),
);

export const MARKDOWN_WRAPPED_HTTP_BODY = buildGeminiHttpResponse(
  '```json\n' + JSON.stringify(MOCK_BUG_ANALYSIS) + '\n```',
);

export const MALFORMED_JSON_HTTP_BODY = buildGeminiHttpResponse(
  '{ this is not valid JSON at all }',
);

export const EMPTY_TEXT_HTTP_BODY = buildGeminiHttpResponse('');

// Response simulating Gemini safety filters blocking the content
export const SAFETY_BLOCKED_HTTP_BODY = {
  candidates: [
    {
      finishReason: 'SAFETY',
      content: {},
      safetyRatings: [
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', probability: 'HIGH' },
      ],
      index: 0,
    },
  ],
  promptFeedback: {
    blockReason: 'SAFETY',
    safetyRatings: [],
  },
};
