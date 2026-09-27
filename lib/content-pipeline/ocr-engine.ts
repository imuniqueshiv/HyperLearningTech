import type { LoadedDocument } from "./document-loader";
import type { RawDocument } from "./raw-document";

/**
 * Pluggable OCR / document extraction engine.
 * Downstream code depends only on this interface.
 */
export interface OcrEngine {
  readonly name: string;

  /**
   * Extract a RawDocument from a loaded file into the job workspace.
   * Must write pages/, images/, tables/ artifacts as needed.
   * Must NOT call Gemini or write into content/.
   *
   * When `documents` is provided (multi-image session), engines should
   * treat each entry as a page in order. `document` remains the primary/first page.
   */
  extract(input: {
    jobId: string;
    jobDir: string;
    document: LoadedDocument;
    documents?: LoadedDocument[];
  }): Promise<RawDocument>;
}
