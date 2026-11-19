// Use the same CommonMark/GFM pipeline as the ReactMarkdown project page.
export async function markdownMediaUrls(markdown: string | null | undefined): Promise<string[]> {
  if (!markdown) {
    return [];
  }
  const [
    { unified },
    { default: remarkParse },
    { default: remarkGfm },
    { default: remarkRehype },
    { visit },
  ] = await Promise.all([
    import("unified"),
    import("remark-parse"),
    import("remark-gfm"),
    import("remark-rehype"),
    import("unist-util-visit"),
  ]);
  const parser = unified().use(remarkParse).use(remarkGfm).use(remarkRehype);
  const tree = parser.runSync(parser.parse(markdown));
  const urls = new Set<string>();
  visit(tree, "element", node => {
    const url = node.tagName === "img" ? node.properties.src : node.properties.href;
    if (typeof url !== "string") {
      return;
    }
    try {
      const destination = new URL(url, "https://project.invalid/projetos/");
      const path = decodeURI(destination.pathname);
      if (["http:", "https:"].includes(destination.protocol) && path.includes("/aq-media-")) {
        urls.add(
          destination.origin === "https://project.invalid" ? path : destination.origin + path
        );
      }
    } catch {
      // A malformed destination cannot resolve to a registered media URL.
    }
  });
  return [...urls];
}
