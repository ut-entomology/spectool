export const IN_USE_NODE_FLAG = 1 << 14;
export const CONTAINS_UNUSED_TAXA_FLAG = 1 << 15;

export interface TaxonNode {
  id: number;
  nodeFlags: number;
  nodeHTML: string;
  children: TaxonNode[] | null;
}

export function duplicateTaxonNode(node: TaxonNode): TaxonNode {
  let dupChildren: TaxonNode[] | null = null;
  if (node.children) {
    dupChildren = [];
    for (const child of node.children) {
      dupChildren.push(duplicateTaxonNode(child));
    }
  }
  return {
    id: node.id,
    nodeFlags: node.nodeFlags,
    nodeHTML: node.nodeHTML,
    children: dupChildren
  };
}
