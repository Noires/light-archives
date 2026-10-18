/** ER2-808: GET /stories/:id/series */
export interface StorySeriesPartDto {
  id: number;
  title: string;
  seriesIndex: number | null;
  createdAt: number;
}

export interface StorySeriesDto {
  seriesTitle: string | null;
  author: string;
  authorServer: string;
  /** Ordered by seriesIndex (parts without index last), then creation date. Contains only the story itself when it has no series. */
  parts: StorySeriesPartDto[];
}
