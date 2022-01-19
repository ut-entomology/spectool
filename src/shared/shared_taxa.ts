export interface Taxon {
  taxonID: number;
  name: string;
  rankID: number;
  parentID: number;
  createdByAgentID: number;
  creationDate: Date;
}

export interface TaxonTree {
  containingTaxa: Taxon[];
  root: TaxonSubtree;
}

export interface TaxonSubtree {
  taxon: Taxon;
  children: (Taxon | TaxonSubtree)[];
}
