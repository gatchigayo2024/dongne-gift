import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for API routes
app.use('/api/*', cors())

// ===== API Routes =====

// Get all gifts
app.get('/api/gifts', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM gifts ORDER BY created_at DESC
    `).all()
    
    // Parse images JSON for each gift
    const gifts = results.map((gift: any) => ({
      ...gift,
      images: JSON.parse(gift.images)
    }))
    
    return c.json({ success: true, data: gifts })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get single gift by ID with comments, group buys, and together posts
app.get('/api/gifts/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    // Get gift details
    const gift = await c.env.DB.prepare(`
      SELECT * FROM gifts WHERE id = ?
    `).bind(id).first()
    
    if (!gift) {
      return c.json({ success: false, error: 'Gift not found' }, 404)
    }
    
    // Get comments with user info
    const { results: comments } = await c.env.DB.prepare(`
      SELECT gc.*, u.nickname, u.id as user_id
      FROM gift_comments gc
      JOIN users u ON gc.user_id = u.id
      WHERE gc.gift_id = ?
      ORDER BY gc.created_at DESC
    `).bind(id).all()
    
    // Get group buys with user info
    const { results: groupBuys } = await c.env.DB.prepare(`
      SELECT gb.*, u1.nickname as creator_nickname, u2.nickname as partner_nickname
      FROM group_buys gb
      JOIN users u1 ON gb.creator_user_id = u1.id
      LEFT JOIN users u2 ON gb.partner_user_id = u2.id
      WHERE gb.gift_id = ?
      ORDER BY gb.created_at DESC
    `).bind(id).all()
    
    // Get together posts
    const { results: togetherPosts } = await c.env.DB.prepare(`
      SELECT tp.*, u.nickname
      FROM together_posts tp
      JOIN users u ON tp.author_user_id = u.id
      WHERE tp.gift_id = ?
      ORDER BY tp.created_at DESC
    `).bind(id).all()
    
    // Parse JSON fields
    const parsedTogetherPosts = togetherPosts.map((post: any) => ({
      ...post,
      author_info: JSON.parse(post.author_info)
    }))
    
    return c.json({
      success: true,
      data: {
        ...(gift as any),
        images: JSON.parse((gift as any).images),
        comments,
        groupBuys,
        togetherPosts: parsedTogetherPosts
      }
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Create new group buy
app.post('/api/group-buys', async (c) => {
  try {
    const { giftId, userId, discountRate } = await c.req.json()
    
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    
    const result = await c.env.DB.prepare(`
      INSERT INTO group_buys (gift_id, creator_user_id, discount_rate, expires_at)
      VALUES (?, ?, ?, ?)
    `).bind(giftId, userId, discountRate, expiresAt).run()
    
    return c.json({ success: true, data: { id: result.meta.last_row_id } })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Join group buy
app.post('/api/group-buys/:id/join', async (c) => {
  try {
    const id = c.req.param('id')
    const { userId } = await c.req.json()
    
    // 🔥 같은 사용자가 자신의 공동구매에 참여 가능 (2인분 구매)
    // Update group buy to complete
    await c.env.DB.prepare(`
      UPDATE group_buys 
      SET partner_user_id = ?, is_complete = 1
      WHERE id = ? AND is_complete = 0
    `).bind(userId, id).run()
    
    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get all together posts
app.get('/api/together-posts', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT tp.*, u.nickname, g.store_name, g.address as store_address
      FROM together_posts tp
      JOIN users u ON tp.author_user_id = u.id
      JOIN gifts g ON tp.gift_id = g.id
      ORDER BY tp.created_at DESC
    `).all()
    
    const posts = results.map((post: any) => ({
      ...post,
      author_info: JSON.parse(post.author_info)
    }))
    
    return c.json({ success: true, data: posts })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get single together post
app.get('/api/together-posts/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    const post = await c.env.DB.prepare(`
      SELECT tp.*, u.nickname, g.store_name, g.address as store_address
      FROM together_posts tp
      JOIN users u ON tp.author_user_id = u.id
      JOIN gifts g ON tp.gift_id = g.id
      WHERE tp.id = ?
    `).bind(id).first()
    
    if (!post) {
      return c.json({ success: false, error: 'Post not found' }, 404)
    }
    
    // Get applications
    const { results: applications } = await c.env.DB.prepare(`
      SELECT ta.*, u.nickname
      FROM together_applications ta
      JOIN users u ON ta.applicant_user_id = u.id
      WHERE ta.post_id = ?
      ORDER BY ta.created_at DESC
    `).bind(id).all()
    
    const parsedApplications = applications.map((app: any) => ({
      ...app,
      applicant_info: JSON.parse(app.applicant_info)
    }))
    
    return c.json({
      success: true,
      data: {
        ...(post as any),
        author_info: JSON.parse((post as any).author_info),
        applications: parsedApplications
      }
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Create together post
app.post('/api/together-posts', async (c) => {
  try {
    const { giftId, userId, title, content, visitDate, visitTime, peopleCount, question, authorInfo } = await c.req.json()
    
    const result = await c.env.DB.prepare(`
      INSERT INTO together_posts (gift_id, author_user_id, title, content, visit_date, visit_time, people_count, question, author_info)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(giftId, userId, title, content, visitDate, visitTime, peopleCount, question, JSON.stringify(authorInfo)).run()
    
    return c.json({ success: true, data: { id: result.meta.last_row_id } })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Apply to together post
app.post('/api/together-posts/:id/apply', async (c) => {
  try {
    const postId = c.req.param('id')
    const { userId, answer, applicantInfo } = await c.req.json()
    
    const result = await c.env.DB.prepare(`
      INSERT INTO together_applications (post_id, applicant_user_id, answer, applicant_info)
      VALUES (?, ?, ?, ?)
    `).bind(postId, userId, answer, JSON.stringify(applicantInfo)).run()
    
    return c.json({ success: true, data: { id: result.meta.last_row_id } })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Toggle like (gift or together post)
app.post('/api/likes', async (c) => {
  try {
    const { userId, itemType, itemId } = await c.req.json()
    
    // Check if already liked
    const existing = await c.env.DB.prepare(`
      SELECT id FROM user_likes WHERE user_id = ? AND item_type = ? AND item_id = ?
    `).bind(userId, itemType, itemId).first()
    
    if (existing) {
      // Unlike
      await c.env.DB.prepare(`
        DELETE FROM user_likes WHERE id = ?
      `).bind((existing as any).id).run()
      
      // Decrement likes count
      const table = itemType === 'gift' ? 'gifts' : 'together_posts'
      await c.env.DB.prepare(`
        UPDATE ${table} SET likes = likes - 1 WHERE id = ?
      `).bind(itemId).run()
      
      return c.json({ success: true, action: 'unliked' })
    } else {
      // Like
      await c.env.DB.prepare(`
        INSERT INTO user_likes (user_id, item_type, item_id) VALUES (?, ?, ?)
      `).bind(userId, itemType, itemId).run()
      
      // Increment likes count
      const table = itemType === 'gift' ? 'gifts' : 'together_posts'
      await c.env.DB.prepare(`
        UPDATE ${table} SET likes = likes + 1 WHERE id = ?
      `).bind(itemId).run()
      
      return c.json({ success: true, action: 'liked' })
    }
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get user's likes
app.get('/api/users/:userId/likes', async (c) => {
  try {
    const userId = c.req.param('userId')
    
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM user_likes WHERE user_id = ?
    `).bind(userId).all()
    
    return c.json({ success: true, data: results })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// ===== Frontend =====
// Note: Static files (index.html, CSS, JS) are served directly by Cloudflare Pages
// They are in the dist folder after build

export default app
