# Chapter completion animation cards

User-supplied artwork, used only for the two requested chapter settlement cards.

- Chapter 1: 7e8f2d3f162512f613c4a8b791e81421.mp4, 720 x 800.
- Chapter 2: b1bb89f5f0d0894fb9d8ed3058f03e8a.mp4, 1280 x 672.
- Both motion.mp4 files are unchanged copies of the supplied originals.
- poster.webp is the first frame. extension.webp mirrors a quiet static strip
  from that frame to join the middle without repeating moving decorations.

CompletionMotion draws every source row once at a uniform scale. Additional
height uses only the static middle strip; the original moving top and bottom
are neither cropped nor stretched. An intermediate canvas avoids Safari video
source-rectangle cropping issues. Videos loop muted and inline.

CompletionCard uses explicit pixel dimensions and a body portal, retaining the
iPad modal fix. Content stays in a separate inset scroll region, inside the
parchment and clear of animated dragons, airship, cat, globe and border corners.
All existing close, inspection and next-chapter handlers are retained. The
chapter 2 sliding puzzle and the pre-settlement gameplay animations are unchanged.
