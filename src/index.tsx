import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for API routes
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

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
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>동네선물 - 근처 엄선된 장소들의 할인 방문권을 선물해요</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/style.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <!-- Main Page -->
        <div id="mainPage" class="page active">
            <header class="bg-white shadow-sm sticky top-0 z-50">
                <div class="max-w-4xl mx-auto px-4 py-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <h1 class="text-2xl font-bold text-gray-800">동네선물</h1>
                            <span class="text-sm text-gray-600"><i class="fas fa-map-marker-alt"></i> 서울시 광진구</span>
                        </div>
                    </div>
                    <p class="text-sm text-gray-600 mt-2">동네 엄선된 장소들을 방문하고 환급 받으세요</p>
                </div>
            </header>

            <main class="max-w-4xl mx-auto px-4 py-6">
                <div id="giftCards" class="space-y-4">
                    <!-- Gift cards will be loaded here -->
                </div>
            </main>
        </div>

        <!-- Detail Page -->
        <div id="detailPage" class="page hidden">
            <div class="bg-white shadow-sm sticky top-0 z-50 px-4 py-4">
                <button class="back-button" onclick="navigateToMain()">
                    <i class="fas fa-arrow-left"></i>
                </button>
            </div>
            <main id="detailContent" class="pb-20">
                <!-- Detail content will be loaded here -->
            </main>
        </div>

        <!-- Together Page -->
        <div id="togetherPage" class="page hidden">
            <header class="bg-white shadow-sm sticky top-0 z-50">
                <div class="max-w-4xl mx-auto px-4 py-4">
                    <h1 class="text-2xl font-bold text-gray-800">같이가요</h1>
                    <p class="text-sm text-gray-600 mt-2">같은 시간에 함께 방문할 사람을 찾아보세요</p>
                </div>
            </header>
            <main class="max-w-4xl mx-auto px-4 py-6">
                <div id="togetherCards" class="space-y-4">
                    <!-- Together posts will be loaded here -->
                </div>
            </main>
        </div>

        <!-- My Page -->
        <div id="myPage" class="page hidden">
            <header class="bg-white shadow-sm sticky top-0 z-50">
                <div class="max-w-4xl mx-auto px-4 py-4">
                    <h1 class="text-2xl font-bold text-gray-800">마이페이지</h1>
                </div>
            </header>
            <main class="max-w-4xl mx-auto px-4 py-6">
                <div class="text-center py-20">
                    <i class="fas fa-user-circle text-6xl text-gray-300 mb-4"></i>
                    <p class="text-gray-600">로그인이 필요합니다</p>
                </div>
            </main>
        </div>

        <!-- Bottom Navigation -->
        <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
            <div class="max-w-4xl mx-auto flex justify-around">
                <button class="nav-item flex-1 py-3 text-center active" onclick="navigateTo('main')">
                    <i class="fas fa-gift block mb-1"></i>
                    <span class="text-xs">동네선물</span>
                </button>
                <button class="nav-item flex-1 py-3 text-center" onclick="navigateTo('together')">
                    <i class="fas fa-user-friends block mb-1"></i>
                    <span class="text-xs">같이가요</span>
                </button>
                <button class="nav-item flex-1 py-3 text-center" onclick="navigateTo('my')">
                    <i class="fas fa-user block mb-1"></i>
                    <span class="text-xs">마이페이지</span>
                </button>
            </div>
        </nav>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
