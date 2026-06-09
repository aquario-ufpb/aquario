/**
 * Minimal type declarations for pdf-parse v1's library entry point.
 *
 * pdf-parse@1.x ships no types and the published `@types/pdf-parse` only declares
 * the package root, not the `pdf-parse/lib/pdf-parse.js` subpath we import to skip
 * the library's debug branch. This declares exactly the surface we use.
 */
declare module "pdf-parse/lib/pdf-parse.js" {
  type PdfParseTextItem = {
    str: string;
    transform: number[];
    width: number;
    height?: number;
  };

  type PdfParsePageData = {
    getTextContent: (options: {
      normalizeWhitespace: boolean;
      disableCombineTextItems: boolean;
    }) => Promise<{ items: PdfParseTextItem[] }>;
  };

  type PdfParseOptions = {
    pagerender?: (pageData: PdfParsePageData) => Promise<string>;
    max?: number;
    version?: string;
  };

  type PdfParseResult = {
    numpages: number;
    numrender: number;
    info: unknown;
    metadata: unknown;
    text: string;
    version: string;
  };

  function pdfParse(
    dataBuffer: Buffer | Uint8Array,
    options?: PdfParseOptions
  ): Promise<PdfParseResult>;

  export default pdfParse;
}
