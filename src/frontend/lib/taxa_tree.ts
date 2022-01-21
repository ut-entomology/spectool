export interface TaxonNode {
  id: number;
  name: string;
  rankID: number;
}

export interface TaxonTree {
  containingTaxa: TaxonNode[];
  root: TaxonSubtree;
}

export interface TaxonSubtree extends TaxonNode {
  infoHTML: string;
  children: TaxonSubtree[] | null;
}
