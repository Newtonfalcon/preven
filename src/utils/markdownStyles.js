// Shared style map for react-native-markdown-display — keeps every screen
// that renders backend markdown (summaryMarkdown, borderProfile, etc.)
// visually consistent with the app's slate/black theme.
const markdownStyles = {
  body: { color: '#475569', fontSize: 13, lineHeight: 19 },
  heading1: { color: '#0F172A', fontSize: 16, fontWeight: '700', marginTop: 8, marginBottom: 4 },
  heading2: { color: '#0F172A', fontSize: 15, fontWeight: '700', marginTop: 8, marginBottom: 4 },
  heading3: { color: '#0F172A', fontSize: 14, fontWeight: '700', marginTop: 6, marginBottom: 4 },
  strong: { color: '#0F172A', fontWeight: '700' },
  bullet_list: { marginVertical: 2 },
  ordered_list: { marginVertical: 2 },
  bullet_list_icon: { color: '#0F172A' },
  list_item: { marginVertical: 2, flexDirection: 'row' },
  paragraph: { marginTop: 0, marginBottom: 6 },
  code_inline: {
    backgroundColor: '#F1F5F9',
    color: '#0F172A',
    paddingHorizontal: 4,
    borderRadius: 4,
    fontSize: 12,
  },
};

// Strips Markdown syntax down to plain text — for spots like truncated
// preview cards where numberOfLines needs plain <Text>, not a rendered
// <Markdown> block (which can't be line-clamped the same way).
export function stripMarkdown(input = '') {
  return input
    .replace(/^#{1,6}\s+/gm, '') // headings
    .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
    .replace(/\*([^*]+)\*/g, '$1') // italics
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/^[-*+]\s+/gm, '') // bullet markers
    .replace(/^\d+\.\s+/gm, '') // ordered list markers
    .replace(/\n{2,}/g, ' ') // collapse blank lines
    .replace(/\n/g, ' ')
    .trim();
}

export default markdownStyles;