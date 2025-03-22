import { Schema, model, Document, Types } from 'mongoose';

interface ISeatCategory {
  id: string;
  name: string;
  price: number;
  color: string;
}

interface ISpecialSeat {
  row: number;
  seat: number;
  categoryId: string;
}

interface IScreen extends Document {
  theaterId: Types.ObjectId;
  hallName: string;
  rows: number;
  seatsPerRow: number;
  seatCategories: ISeatCategory[];
  specialSeats: ISpecialSeat[];
  totalSeats: number;
  createdAt: Date;
  updatedAt: Date;
  getSeatCategory(row: number, seat: number): string;
  assignSeatToCategory(row: number, seat: number, categoryId: string): Promise<void>;
  updateCategoryPrice(categoryId: string, newPrice: number): Promise<void>;
}

const screenSchema = new Schema<IScreen>(
  {
    theaterId: {
      type: Schema.Types.ObjectId,
      ref: 'Theater',
      required: true,
    },
    hallName: {
      type: String,
      required: true,
      trim: true,
    },
    rows: {
      type: Number,
      required: true,
      min: 1,
    },
    seatsPerRow: {
      type: Number,
      required: true,
      min: 1,
    },
    seatCategories: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        color: { type: String, required: true },
      },
    ],
    specialSeats: [
      {
        row: { type: Number, required: true },
        seat: { type: Number, required: true },
        categoryId: { type: String, required: true },
      },
    ],
    totalSeats: {
      type: Number,
      required: true,
      min: 0,
    },
  },
{
    timestamps: true,
}
);

screenSchema.index({ theaterId: 1, hallName: 1 }, { unique: true });

screenSchema.pre('save', function (next) {
  this.totalSeats = this.rows * this.seatsPerRow;

  const seatSet = new Set<string>();
  for (const specialSeat of this.specialSeats) {
    const seatKey = `${specialSeat.row}-${specialSeat.seat}`;
    if (seatSet.has(seatKey)) {
      console.error(`Duplicate special seat at row ${specialSeat.row}, seat ${specialSeat.seat}`);
      return next(new Error(`Duplicate special seat at row ${specialSeat.row}, seat ${specialSeat.seat}`));
    }
    seatSet.add(seatKey);

    if (specialSeat.row > this.rows || specialSeat.seat > this.seatsPerRow) {
      console.error(`Special seat at row ${specialSeat.row}, seat ${specialSeat.seat} exceeds hall dimensions`);
      return next(new Error(`Special seat at row ${specialSeat.row}, seat ${specialSeat.seat} exceeds hall dimensions`));
    }
    if (!this.seatCategories.some((cat: any) => cat.id === specialSeat.categoryId)) {
      console.error(`Invalid categoryId ${specialSeat.categoryId} for special seat`);
      return next(new Error(`Invalid categoryId ${specialSeat.categoryId} for special seat`));
    }
  }

  next();
});

screenSchema.methods.getSeatCategory = function (row: number, seat: number): string {
  const specialSeat = this.specialSeats.find((s: any) => s.row === row && s.seat === seat);
  return specialSeat ? specialSeat.categoryId : 'regular';
};

screenSchema.methods.assignSeatToCategory = async function (row: number, seat: number, categoryId: string) {
  if (!this.seatCategories.some((cat: any) => cat.id === categoryId)) {
    throw new Error(`Category ${categoryId} does not exist`);
  }

  const existingIndex = this.specialSeats.findIndex((s: any) => s.row === row && s.seat === seat);

  if (existingIndex !== -1) {
    if (this.specialSeats[existingIndex].categoryId === categoryId) return;
    this.specialSeats[existingIndex].categoryId = categoryId;
  } else {
    this.specialSeats.push({ row, seat, categoryId });
  }

  await this.save();
};

screenSchema.methods.updateCategoryPrice = async function (categoryId: string, newPrice: number) {
  const category = this.seatCategories.find((cat: any) => cat.id === categoryId);
  if (!category) throw new Error(`Category ${categoryId} not found`);
  category.price = newPrice;
  await this.save();
};

export default model<IScreen>('Screen', screenSchema);