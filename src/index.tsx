import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  DB: D1Database;
  NHN_CLOUD_APP_KEY?: string;
  NHN_CLOUD_SECRET_KEY?: string;
  NHN_CLOUD_SENDER_NUMBER?: string;
  SESSION_SECRET?: string;
}

const app = new Hono<{ Bindings: Bindings }>()

// 🔥 인증번호 저장소 (메모리 기반 - 실제 운영에서는 Redis나 KV 사용 권장)
const verificationCodes = new Map<string, { code: string; expiresAt: number; nickname: string }>()

// Enable CORS for API routes
app.use('/api/*', cors())

// ===== API Routes =====

// 🔥 SMS 인증번호 발송
app.post('/api/auth/send-code', async (c) => {
  try {
    const { phoneNumber, nickname } = await c.req.json()
    
    if (!phoneNumber || !nickname) {
      return c.json({ success: false, error: '전화번호와 닉네임을 입력해주세요' }, 400)
    }
    
    // 인증번호 생성 (6자리)
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    
    // 인증번호 저장 (5분 유효)
    const expiresAt = Date.now() + 5 * 60 * 1000
    verificationCodes.set(phoneNumber, { code, expiresAt, nickname })
    
    console.log(`📱 [DEV] 인증번호 발송: ${phoneNumber} -> ${code}`)
    
    // 🔥 NHN Cloud SMS API 호출 (실제 환경)
    if (c.env.NHN_CLOUD_APP_KEY && c.env.NHN_CLOUD_SENDER_NUMBER) {
      try {
        const nhnResponse = await fetch('https://api-sms.cloud.toast.com/sms/v3.0/appKeys/' + c.env.NHN_CLOUD_APP_KEY + '/sender/sms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json;charset=UTF-8'
          },
          body: JSON.stringify({
            body: `[동네선물] 인증번호는 [${code}]입니다. 5분 이내에 입력해주세요.`,
            sendNo: c.env.NHN_CLOUD_SENDER_NUMBER,
            recipientList: [
              {
                recipientNo: phoneNumber,
                internationalRecipientNo: phoneNumber
              }
            ]
          })
        })
        
        const nhnData = await nhnResponse.json()
        console.log('📨 NHN Cloud SMS Response:', nhnData)
      } catch (error) {
        console.error('❌ NHN Cloud SMS Error:', error)
        // SMS 발송 실패해도 개발 환경에서는 계속 진행
      }
    }
    
    return c.json({ 
      success: true, 
      message: '인증번호가 발송되었습니다',
      // 개발 환경에서만 코드 반환
      devCode: !c.env.NHN_CLOUD_APP_KEY ? code : undefined
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 🔥 인증번호 검증 및 로그인
app.post('/api/auth/verify-code', async (c) => {
  try {
    const { phoneNumber, code } = await c.req.json()
    
    if (!phoneNumber || !code) {
      return c.json({ success: false, error: '전화번호와 인증번호를 입력해주세요' }, 400)
    }
    
    // 인증번호 확인
    const stored = verificationCodes.get(phoneNumber)
    
    if (!stored) {
      return c.json({ success: false, error: '인증번호를 먼저 요청해주세요' }, 400)
    }
    
    if (stored.expiresAt < Date.now()) {
      verificationCodes.delete(phoneNumber)
      return c.json({ success: false, error: '인증번호가 만료되었습니다' }, 400)
    }
    
    if (stored.code !== code) {
      return c.json({ success: false, error: '인증번호가 일치하지 않습니다' }, 400)
    }
    
    // 인증 성공 - 사용자 확인 또는 생성
    let user = await c.env.DB.prepare(`
      SELECT * FROM users WHERE phone_number = ?
    `).bind(phoneNumber).first() as any
    
    if (user) {
      // 기존 사용자 - 닉네임 업데이트
      const oldNickname = user.nickname
      const newNickname = stored.nickname
      
      if (oldNickname !== newNickname) {
        // 닉네임 변경됨 - users 테이블 업데이트
        await c.env.DB.prepare(`
          UPDATE users SET nickname = ? WHERE id = ?
        `).bind(newNickname, user.id).run()
        
        console.log(`📝 닉네임 변경: ${oldNickname} -> ${newNickname} (userId: ${user.id})`)
      }
      
      user.nickname = newNickname
    } else {
      // 신규 사용자 - 생성
      const result = await c.env.DB.prepare(`
        INSERT INTO users (phone_number, nickname) VALUES (?, ?)
      `).bind(phoneNumber, stored.nickname).run()
      
      user = {
        id: result.meta.last_row_id,
        phone_number: phoneNumber,
        nickname: stored.nickname
      }
      
      console.log(`🆕 신규 사용자 생성: ${user.nickname} (userId: ${user.id})`)
    }
    
    // 인증번호 삭제
    verificationCodes.delete(phoneNumber)
    
    return c.json({ 
      success: true, 
      message: '로그인 성공',
      user: {
        id: user.id,
        phoneNumber: user.phone_number,
        nickname: user.nickname
      }
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

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
      SELECT gb.*, 
             u1.nickname as creator_nickname, 
             u2.nickname as partner_nickname,
             u3.nickname as partner2_nickname
      FROM group_buys gb
      JOIN users u1 ON gb.creator_user_id = u1.id
      LEFT JOIN users u2 ON gb.partner_user_id = u2.id
      LEFT JOIN users u3 ON gb.partner2_user_id = u3.id
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
      INSERT INTO group_buys (gift_id, creator_user_id, discount_rate, participant_count, expires_at)
      VALUES (?, ?, ?, 1, ?)
    `).bind(giftId, userId, discountRate, expiresAt).run()
    
    return c.json({ success: true, data: { id: result.meta.last_row_id } })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Join group buy (3명 시스템)
app.post('/api/group-buys/:id/join', async (c) => {
  try {
    const id = c.req.param('id')
    const { userId } = await c.req.json()
    
    // 현재 참여자 수 확인
    const groupBuy = await c.env.DB.prepare(`
      SELECT participant_count, partner_user_id, partner2_user_id 
      FROM group_buys 
      WHERE id = ? AND is_complete = 0
    `).bind(id).first()
    
    if (!groupBuy) {
      return c.json({ success: false, error: '이미 완료되었거나 존재하지 않는 공동구매입니다' }, 400)
    }
    
    const currentCount = groupBuy.participant_count as number
    
    if (currentCount >= 3) {
      return c.json({ success: false, error: '이미 정원이 찼습니다' }, 400)
    }
    
    // 참여자 추가
    if (currentCount === 1) {
      // 2번째 참여자
      await c.env.DB.prepare(`
        UPDATE group_buys 
        SET partner_user_id = ?, participant_count = 2
        WHERE id = ?
      `).bind(userId, id).run()
    } else if (currentCount === 2) {
      // 3번째 참여자 - 공동구매 완료!
      await c.env.DB.prepare(`
        UPDATE group_buys 
        SET partner2_user_id = ?, participant_count = 3, is_complete = 1
        WHERE id = ?
      `).bind(userId, id).run()
    }
    
    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get user by ID
app.get('/api/users/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const user = await c.env.DB.prepare(`
      SELECT id, nickname, phone_number FROM users WHERE id = ?
    `).bind(id).first()
    
    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404)
    }
    
    return c.json({ success: true, data: user })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Update user nickname
app.put('/api/users/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const { nickname } = await c.req.json()
    
    await c.env.DB.prepare(`
      UPDATE users SET nickname = ? WHERE id = ?
    `).bind(nickname, id).run()
    
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
