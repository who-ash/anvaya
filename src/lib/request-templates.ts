// Industry-standard request templates with type-specific JSON schemas
// Each template defines the fields required for that type of request

export interface TemplateField {
    id: string;
    label: string;
    type: 'text' | 'textarea' | 'richtext' | 'select' | 'file';
    placeholder?: string;
    required: boolean;
    helperText?: string;
    options?: { value: string; label: string }[];
    accept?: string;
    multiple?: boolean;
}

export interface RequestTemplateConfig {
    type: 'bug' | 'feature_request' | 'feedback' | 'query';
    name: string;
    description: string;
    icon: string;
    schema: {
        fields: TemplateField[];
    };
}

export const REQUEST_TEMPLATES: Record<string, RequestTemplateConfig> = {
    bug: {
        type: 'bug',
        name: 'Bug Report',
        description: 'Report a bug or issue you encountered in the system',
        icon: 'Bug',
        schema: {
            fields: [
                {
                    id: 'title',
                    label: 'Bug Title',
                    type: 'text',
                    placeholder: 'Brief summary of the bug',
                    required: true,
                },
                {
                    id: 'description',
                    label: 'Description',
                    type: 'richtext',
                    placeholder: 'Detailed description of the bug',
                    required: true,
                },
                {
                    id: 'stepsToReproduce',
                    label: 'Steps to Reproduce',
                    type: 'richtext',
                    placeholder: '1. Go to...\n2. Click on...\n3. Observe...',
                    required: true,
                    helperText: 'List the exact steps to reproduce the issue',
                },
                {
                    id: 'expectedBehavior',
                    label: 'Expected Behavior',
                    type: 'richtext',
                    placeholder: 'What did you expect to happen?',
                    required: true,
                },
                {
                    id: 'actualBehavior',
                    label: 'Actual Behavior',
                    type: 'richtext',
                    placeholder: 'What actually happened?',
                    required: true,
                },
                {
                    id: 'environment',
                    label: 'Environment',
                    type: 'text',
                    placeholder:
                        'Browser, OS, Device (e.g., Chrome 120, Windows 11)',
                    required: false,
                },
                {
                    id: 'severity',
                    label: 'Severity',
                    type: 'select',
                    options: [
                        {
                            value: 'blocker',
                            label: 'Blocker - System unusable',
                        },
                        {
                            value: 'critical',
                            label: 'Critical - Major feature broken',
                        },
                        { value: 'major', label: 'Major - Feature impaired' },
                        { value: 'minor', label: 'Minor - Cosmetic issue' },
                    ],
                    required: true,
                },
                {
                    id: 'screenshots',
                    label: 'Screenshots / Attachments',
                    type: 'file',
                    accept: 'image/*,.gif,.mp4,.webm',
                    multiple: true,
                    required: false,
                    helperText: 'Upload images, GIFs, or screen recordings',
                },
            ],
        },
    },
    feature_request: {
        type: 'feature_request',
        name: 'Feature Request',
        description: 'Suggest a new feature or improvement',
        icon: 'Lightbulb',
        schema: {
            fields: [
                {
                    id: 'title',
                    label: 'Feature Title',
                    type: 'text',
                    placeholder: 'Brief title for the feature',
                    required: true,
                },
                {
                    id: 'description',
                    label: 'Feature Description',
                    type: 'richtext',
                    placeholder: 'Describe the feature you would like to see',
                    required: true,
                },
                {
                    id: 'problem',
                    label: 'Problem Statement',
                    type: 'richtext',
                    placeholder: 'What problem does this feature solve?',
                    required: true,
                    helperText:
                        'Explain the pain point or challenge this addresses',
                },
                {
                    id: 'proposedSolution',
                    label: 'Proposed Solution',
                    type: 'richtext',
                    placeholder: 'How do you envision this feature working?',
                    required: true,
                },
                {
                    id: 'alternatives',
                    label: 'Alternatives Considered',
                    type: 'richtext',
                    placeholder:
                        'Have you considered any alternative solutions?',
                    required: false,
                },
                {
                    id: 'useCases',
                    label: 'Use Cases',
                    type: 'richtext',
                    placeholder:
                        'Describe specific scenarios where this feature would be used',
                    required: false,
                },
                {
                    id: 'references',
                    label: 'References / Examples',
                    type: 'richtext',
                    placeholder:
                        'Links to similar features in other products, mockups, etc.',
                    required: false,
                    helperText:
                        'Provide URLs, screenshots, or examples from other products',
                },
                {
                    id: 'businessValue',
                    label: 'Business Value',
                    type: 'select',
                    options: [
                        {
                            value: 'high',
                            label: 'High - Critical for business goals',
                        },
                        { value: 'medium', label: 'Medium - Nice to have' },
                        { value: 'low', label: 'Low - Minor improvement' },
                    ],
                    required: true,
                },
                {
                    id: 'attachments',
                    label: 'Mockups / Attachments',
                    type: 'file',
                    accept: 'image/*,.pdf,.fig,.sketch',
                    multiple: true,
                    required: false,
                    helperText:
                        'Upload mockups, wireframes, or reference images',
                },
            ],
        },
    },
    feedback: {
        type: 'feedback',
        name: 'Feedback',
        description: 'Share your thoughts, suggestions, or general feedback',
        icon: 'MessageSquare',
        schema: {
            fields: [
                {
                    id: 'title',
                    label: 'Feedback Title',
                    type: 'text',
                    placeholder: 'Brief summary of your feedback',
                    required: true,
                },
                {
                    id: 'category',
                    label: 'Feedback Category',
                    type: 'select',
                    options: [
                        {
                            value: 'usability',
                            label: 'Usability - Ease of use',
                        },
                        {
                            value: 'performance',
                            label: 'Performance - Speed and reliability',
                        },
                        { value: 'design', label: 'Design - Look and feel' },
                        {
                            value: 'documentation',
                            label: 'Documentation - Help and guides',
                        },
                        { value: 'other', label: 'Other' },
                    ],
                    required: true,
                },
                {
                    id: 'feedback',
                    label: 'Your Feedback',
                    type: 'richtext',
                    placeholder: 'Share your detailed feedback...',
                    required: true,
                },
                {
                    id: 'rating',
                    label: 'Overall Experience',
                    type: 'select',
                    options: [
                        { value: '5', label: '⭐⭐⭐⭐⭐ Excellent' },
                        { value: '4', label: '⭐⭐⭐⭐ Good' },
                        { value: '3', label: '⭐⭐⭐ Average' },
                        { value: '2', label: '⭐⭐ Poor' },
                        { value: '1', label: '⭐ Very Poor' },
                    ],
                    required: false,
                },
                {
                    id: 'suggestions',
                    label: 'Suggestions for Improvement',
                    type: 'richtext',
                    placeholder: 'Any specific suggestions?',
                    required: false,
                },
                {
                    id: 'screenshots',
                    label: 'Screenshots',
                    type: 'file',
                    accept: 'image/*',
                    multiple: true,
                    required: false,
                },
            ],
        },
    },
    query: {
        type: 'query',
        name: 'Query / Question',
        description: 'Ask a question or seek clarification',
        icon: 'HelpCircle',
        schema: {
            fields: [
                {
                    id: 'title',
                    label: 'Question Title',
                    type: 'text',
                    placeholder: 'Brief summary of your question',
                    required: true,
                },
                {
                    id: 'question',
                    label: 'Your Question',
                    type: 'richtext',
                    placeholder: 'Describe your question in detail...',
                    required: true,
                },
                {
                    id: 'context',
                    label: 'Context',
                    type: 'richtext',
                    placeholder: 'Provide any relevant background or context',
                    required: false,
                    helperText:
                        'What were you trying to do when this question arose?',
                },
                {
                    id: 'category',
                    label: 'Category',
                    type: 'select',
                    options: [
                        {
                            value: 'how-to',
                            label: 'How To - Need instructions',
                        },
                        {
                            value: 'clarification',
                            label: 'Clarification - Need explanation',
                        },
                        {
                            value: 'troubleshooting',
                            label: 'Troubleshooting - Something not working',
                        },
                        { value: 'general', label: 'General Inquiry' },
                    ],
                    required: true,
                },
                {
                    id: 'urgency',
                    label: 'Urgency',
                    type: 'select',
                    options: [
                        { value: 'urgent', label: 'Urgent - Blocking my work' },
                        { value: 'normal', label: 'Normal - Can wait' },
                        { value: 'low', label: 'Low - Just curious' },
                    ],
                    required: true,
                },
                {
                    id: 'attachments',
                    label: 'Attachments',
                    type: 'file',
                    accept: 'image/*,.pdf,.doc,.docx',
                    multiple: true,
                    required: false,
                    helperText: 'Upload any relevant files or screenshots',
                },
            ],
        },
    },
};

export type RequestType = keyof typeof REQUEST_TEMPLATES;
