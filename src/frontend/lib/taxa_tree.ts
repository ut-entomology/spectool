export interface TaxonTree {
  containingTaxaHTML: string[];
  root: TaxonNode;
}

export interface TaxonNode {
  id: number;
  nodeFlags: number;
  nodeHTML: string;
  children: TaxonNode[] | null;
}
