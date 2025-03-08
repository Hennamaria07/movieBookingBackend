import { Request, Response } from 'express';
import Report from '../../models/report.model';

export const getReports = async (req: Request, res: Response) => {
    try {
        const reports = await Report.find();
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reports', error });
    }
};

export const resolveReport = async (req: Request, res: Response) => {
    try {
        const report = await Report.findByIdAndUpdate(req.params.id, { status: 'Resolved' }, { new: true });
        if (!report) return res.status(404).json({ message: 'Report not found' });
        res.json(report);
    } catch (error) {
        res.status(500).json({ message: 'Error resolving report', error });
    }
};