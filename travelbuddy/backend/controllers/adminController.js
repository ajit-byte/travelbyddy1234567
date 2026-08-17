import Profile from '../models/Profile.js';
import { streamUpload } from '../utils/cloudinaryUpload.js';

export async function submitKyc(req, res) {
  try {
    const { fullName, documentType } = req.body;
    if (!fullName || !documentType) return res.status(400).json({ msg: 'Full name and document type required' });
    let documentUrl = '';
    if (req.file) {
      try {
        const result = await streamUpload(req, 'kyc_documents');
        documentUrl = result.secure_url;
      } catch {
        documentUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      }
    }
    await Profile.findByIdAndUpdate(req.user.id, {
      'kyc.status': 'pending', 'kyc.fullName': fullName, 'kyc.documentType': documentType,
      'kyc.documentUrl': documentUrl, 'kyc.submittedAt': new Date(), 'kyc.rejectionReason': '',
    });
    res.json({ msg: 'KYC request submitted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
}

export async function getKycRequests(req, res) {
  try {
    const status = req.query.status || 'pending';
    const users = await Profile.find({ 'kyc.status': status })
      .select('username nickname email profileIconUrl kyc createdAt')
      .sort({ 'kyc.submittedAt': -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
}

export async function approveKyc(req, res) {
  try {
    await Profile.findByIdAndUpdate(req.params.userId, {
      'kyc.status': 'approved', 'kyc.reviewedAt': new Date(), 'kyc.rejectionReason': '',
    });
    res.json({ msg: 'KYC approved' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
}

export async function rejectKyc(req, res) {
  try {
    const { reason } = req.body;
    await Profile.findByIdAndUpdate(req.params.userId, {
      'kyc.status': 'rejected', 'kyc.reviewedAt': new Date(),
      'kyc.rejectionReason': reason || 'Document not accepted',
    });
    res.json({ msg: 'KYC rejected' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
}

export async function getStats(req, res) {
  try {
    const [total, pending, approved, rejected] = await Promise.all([
      Profile.countDocuments({ isAdmin: { $ne: true } }),
      Profile.countDocuments({ 'kyc.status': 'pending' }),
      Profile.countDocuments({ 'kyc.status': 'approved' }),
      Profile.countDocuments({ 'kyc.status': 'rejected' }),
    ]);
    res.json({ totalUsers: total, pendingKyc: pending, approvedKyc: approved, rejectedKyc: rejected });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
}
