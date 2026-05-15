import express from 'express';
import requireAuth from '../middleware/auth.js';

const router = express.Router();

router.post('/', requireAuth, async (req, res) => {
  const { title, date, start, end, note, color } = req.body;

  const { data, error } = await supabaseAdmin
    .from('events')
    .insert({
      user_id: req.user.id,
      title,
      date,
      start,
      end,
      note,
      color,
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('events')
    .select('*')
    .eq('user_id', req.user.id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

export default router;