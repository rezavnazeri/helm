export interface CardBase {
  id: string;
  collapsed: boolean;
}

export type Cells<Card extends CardBase> = (Card | null)[];
