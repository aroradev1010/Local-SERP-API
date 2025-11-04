import { Schema, model, Document } from "mongoose";

export interface IResult {
  position: number;
  title: string;
  url: string;
  snippet?: string;
  summary?: string;
  type?: string;
}

export interface ISearch extends Document {
  query: string;
  results: IResult[];
  aggregateSummary?: string;
  createdAt: Date;
}

const ResultSchema = new Schema<IResult>(
  {
    position: Number,
    title: String,
    url: String,
    snippet: String,
    summary: String,
    type: String,
  },
  { _id: false }
);

const SearchSchema = new Schema<ISearch>({
  query: { type: String, index: true },
  results: [ResultSchema],
  aggregateSummary: String,
  createdAt: { type: Date, default: Date.now },
});

// expires after 6 hours
SearchSchema.index({ createdAt: 1 }, { expireAfterSeconds: 21600 });

export default model<ISearch>("Search", SearchSchema);
