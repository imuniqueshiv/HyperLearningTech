/**
 * Diagram write statistics for write-report.json.
 */

export interface DiagramWriteStats {
  diagramsCopied: number;
  diagramsReused: number;
  diagramsSkipped: number;
  diagramErrors: number;
  storageBytesCopied: number;
  destinationFolders: string[];
  manifestPath: string | null;
}

export function emptyDiagramWriteStats(): DiagramWriteStats {
  return {
    diagramsCopied: 0,
    diagramsReused: 0,
    diagramsSkipped: 0,
    diagramErrors: 0,
    storageBytesCopied: 0,
    destinationFolders: [],
    manifestPath: null,
  };
}
