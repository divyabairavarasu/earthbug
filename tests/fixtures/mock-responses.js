// Minimal 1×1 white JPEG in base64 — used as a stand-in image during tests
export const TINY_IMAGE_BASE64 =
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8U' +
  'HRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgN' +
  'DRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy' +
  'MjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAA' +
  'AAAAAAAAAAAAAAAAAP/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAA' +
  'AAAA/9oADAMBAAIRAxEAPwCwABmX/9k=';

export const TINY_IMAGE_DATA_URL = `data:image/jpeg;base64,${TINY_IMAGE_BASE64}`;

// Well-formed successful Gemini API response with production-ready fields
export const MOCK_BUG_ANALYSIS = {
  name: 'Ladybug',
  scientificName: 'Coccinella septempunctata',
  verdict: 'Mostly Helpful',
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
  nuance: 'Non-native species can outcompete native ladybug populations.',
  ecoActions: [
    "Don't spray pesticides — ladybugs naturally control aphids",
    'Plant marigolds and fennel to attract ladybugs',
    'Report your sighting to iNaturalist',
  ],
};

// Mostly Harmful verdict fixture
export const MOCK_HARMFUL_BUG = {
  name: 'Japanese Beetle',
  scientificName: 'Popillia japonica',
  verdict: 'Mostly Harmful',
  confidence: 'high',
  summary: 'An invasive pest that skeletonizes leaves and damages roots.',
  benefits: [],
  harms: [{ title: 'Leaf damage', description: 'Skeletonizes foliage of over 300 plant species.' }],
  ecosystemRole: 'An introduced species with few natural predators in North America.',
  didYouKnow: 'Japanese beetles release aggregation pheromones to attract more beetles.',
  soilImpact: 'negative',
  plantImpact: 'negative',
  nuance: 'Populations can be managed with targeted biological controls.',
  ecoActions: ['Remove beetles by hand in the morning', 'Avoid using Japanese beetle traps near plants'],
};

// Context-Dependent verdict fixture
export const MOCK_CONTEXT_BUG = {
  name: 'Ground Beetle',
  scientificName: 'Carabidae sp.',
  verdict: 'Context-Dependent',
  confidence: 'medium',
  summary: 'A predatory beetle that hunts both pests and beneficial insects.',
  benefits: [{ title: 'Pest Control', description: 'Eats slugs, caterpillars, and other garden pests.' }],
  harms: [{ title: 'Beneficial prey', description: 'May also hunt earthworms and small beneficial insects.' }],
  ecosystemRole: 'A key ground-level predator in many temperate garden ecosystems.',
  didYouKnow: 'Ground beetles are nocturnal and hide under stones during the day.',
  soilImpact: 'neutral',
  plantImpact: 'neutral',
  nuance: 'Overall impact depends heavily on the local garden balance.',
  ecoActions: ['Provide log piles for shelter', 'Avoid soil disturbance near beetle habitats'],
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

export const QUOTA_EXCEEDED_HTTP_BODY = {
  error: {
    code: 429,
    message: 'Resource has been exhausted. Please retry in 0s.',
    status: 'RESOURCE_EXHAUSTED',
  },
};

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
