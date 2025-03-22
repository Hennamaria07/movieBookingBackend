interface ScreenData {
    hallName: string;
    rows: number;
    seatsPerRow: number;
    seatCategories: { id: string; name: string; defaultPrice: number; color: string }[];
    specialSeats: { row: number; seat: number; category: string }[];
  }
  
  export const validateScreenData = (data: Partial<ScreenData>): string | null => {
    if (data.hallName && !data.hallName.trim()) return 'Hall name is required';
    if (data.rows !== undefined && (isNaN(data.rows) || data.rows < 1)) return 'Rows must be at least 1';
    if (data.seatsPerRow !== undefined && (isNaN(data.seatsPerRow) || data.seatsPerRow < 1)) return 'Seats per row must be at least 1';
    
    if (data.seatCategories) {
      if (!Array.isArray(data.seatCategories) || data.seatCategories.length < 1) return 'At least one seat category is required';
      for (const cat of data.seatCategories) {
        if (!cat.id || !cat.name || cat.defaultPrice === undefined || !cat.color) {
          return 'Each seat category must have an id, name, price, and color';
        }
        if (cat.defaultPrice < 0) return 'Price must be non-negative';
      }
    }
  
    if (data.specialSeats) {
      if (!Array.isArray(data.specialSeats)) return 'Special seats must be an array';
      for (const seat of data.specialSeats) {
        if (!seat.row || !seat.seat || !seat.category) return 'Each special seat must have row, seat, and category';
        if (seat.row < 1 || seat.seat < 1) return 'Row and seat must be positive';
      }
    }
  
    return null;
  };