// Current user (mock - in real app, this would come from authentication)
let currentUserId = 1;
let currentUserNickname = '여행좋아';

// Current page state
let currentPage = 'main';
let currentGiftId = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadGifts();
});

// Navigation
function navigateTo(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    
    // Show selected page
    currentPage = page;
    
    if (page === 'main') {
        document.getElementById('mainPage').classList.remove('hidden');
        document.getElementById('mainPage').classList.add('active');
        document.querySelectorAll('.nav-item')[0].classList.add('active');
        loadGifts();
    } else if (page === 'together') {
        document.getElementById('togetherPage').classList.remove('hidden');
        document.getElementById('togetherPage').classList.add('active');
        document.querySelectorAll('.nav-item')[1].classList.add('active');
        loadTogetherPosts();
    } else if (page === 'my') {
        document.getElementById('myPage').classList.remove('hidden');
        document.getElementById('myPage').classList.add('active');
        document.querySelectorAll('.nav-item')[2].classList.add('active');
    }
}

function navigateToMain() {
    navigateTo('main');
}

// Load gifts
async function loadGifts() {
    try {
        const response = await axios.get('/api/gifts');
        const gifts = response.data.data;
        
        const container = document.getElementById('giftCards');
        container.innerHTML = gifts.map(gift => `
            <div class="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition" onclick="showGiftDetail(${gift.id})">
                <img src="${gift.images[0]}" alt="${gift.product_name}" class="w-full h-48 object-cover">
                <div class="p-4">
                    <p class="text-xs text-gray-500 mb-1">${gift.store_intro}</p>
                    <h3 class="text-lg font-bold mb-2">${gift.product_name}</h3>
                    <div class="flex items-center justify-between mb-2">
                        <div>
                            <span class="text-sm text-gray-500 line-through">${gift.original_price.toLocaleString()}원</span>
                            <span class="text-xs text-red-500 font-semibold ml-2">${gift.discount_rate}%</span>
                        </div>
                        <span class="text-lg font-bold text-blue-600">${gift.discounted_price.toLocaleString()}원</span>
                    </div>
                    <div class="flex items-center justify-between text-sm text-gray-500">
                        <span><i class="fas fa-map-marker-alt"></i> ${gift.location}</span>
                        <div>
                            <span class="mr-3"><i class="far fa-heart"></i> ${gift.likes}</span>
                            <span><i class="fas fa-shopping-cart"></i> ${gift.purchases}</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load gifts:', error);
    }
}

// Show gift detail
async function showGiftDetail(giftId) {
    try {
        currentGiftId = giftId;
        const response = await axios.get(\`/api/gifts/\${giftId}\`);
        const gift = response.data.data;
        
        document.getElementById('detailContent').innerHTML = `
            <!-- Image Slider -->
            <div class="relative">
                <div class="overflow-x-auto flex snap-x snap-mandatory" id="imageSlider">
                    ${gift.images.map(img => `
                        <img src="${img}" alt="${gift.product_name}" class="w-full h-64 object-cover flex-shrink-0 snap-center">
                    `).join('')}
                </div>
                <div class="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                    ${gift.images.map((_, i) => `
                        <div class="w-2 h-2 rounded-full bg-white opacity-50"></div>
                    `).join('')}
                </div>
            </div>

            <!-- Info -->
            <div class="p-4">
                <p class="text-sm text-gray-500 mb-2">${gift.store_intro}</p>
                <h2 class="text-2xl font-bold mb-3">${gift.product_name}</h2>
                <div class="flex items-center justify-between mb-4 p-4 bg-blue-50 rounded-lg">
                    <div>
                        <span class="text-sm text-gray-500 line-through block">${gift.original_price.toLocaleString()}원</span>
                        <span class="text-2xl font-bold text-blue-600">${gift.discounted_price.toLocaleString()}원</span>
                    </div>
                    <div class="text-right">
                        <span class="text-xs text-gray-500 block">최대 환급</span>
                        <span class="text-xl font-bold text-red-500">${gift.discount_rate}%</span>
                    </div>
                </div>

                <!-- Description -->
                <section class="mb-6">
                    <h4 class="text-lg font-bold mb-2">상세 소개</h4>
                    <p class="text-gray-700 whitespace-pre-line">${gift.description}</p>
                </section>

                <!-- Store Info -->
                <section class="mb-6">
                    <h4 class="text-lg font-bold mb-2">가게 정보</h4>
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <p class="font-semibold mb-1">${gift.store_name}</p>
                        <p class="text-sm text-gray-600 mb-3">${gift.address}</p>
                        <button class="w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                            <i class="fas fa-map-marked-alt"></i> 네이버지도에서 보기
                        </button>
                    </div>
                </section>

                <!-- Comments -->
                <section class="mb-6">
                    <h3 class="text-xl font-bold mb-4">구매하기</h3>
                    <p class="text-sm text-gray-600 mb-3">나에게 혹은 친구에게 자유롭게 선물하세요</p>
                    <div class="space-y-3 max-h-64 overflow-y-auto">
                        ${gift.comments.map(comment => `
                            <div class="bg-gray-50 p-3 rounded-lg">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="font-semibold text-sm">${comment.nickname}</span>
                                    <span class="text-xs text-gray-500">${new Date(comment.created_at).toLocaleDateString()}</span>
                                </div>
                                <p class="text-sm text-gray-700 mb-2">${comment.comment}</p>
                                <span class="text-xs text-gray-500"><i class="far fa-thumbs-up"></i> ${comment.empathy}</span>
                            </div>
                        `).join('')}
                    </div>
                </section>

                <!-- Group Buys -->
                <section class="mb-6">
                    <div class="flex items-center justify-between mb-3">
                        <div>
                            <h3 class="text-xl font-bold">공동구매</h3>
                            <p class="text-sm text-gray-600">2명씩 공동구매로 더 많이 환급 받을 수 있어요</p>
                        </div>
                        <button class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600" onclick="createGroupBuy()">신청하기</button>
                    </div>
                    <div class="space-y-3">
                        ${gift.groupBuys.length > 0 ? gift.groupBuys.map(gb => `
                            <div class="bg-gray-50 p-4 rounded-lg">
                                <div class="flex items-center justify-between mb-2">
                                    <div class="flex items-center gap-2">
                                        <div class="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                                            ${gb.creator_nickname[0]}
                                        </div>
                                        ${gb.is_complete ? `
                                            <div class="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                                                ${gb.partner_nickname[0]}
                                            </div>
                                        ` : ''}
                                    </div>
                                    <span class="text-lg font-bold text-red-500">${gb.discount_rate}%</span>
                                </div>
                                ${gb.is_complete ? `
                                    <span class="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">매칭 완료</span>
                                ` : `
                                    <div class="flex items-center justify-between">
                                        <span class="text-xs text-gray-500">남은 시간: ${getTimeRemaining(gb.expires_at)}</span>
                                        <button class="px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600" onclick="joinGroupBuy(${gb.id})">참여하기</button>
                                    </div>
                                `}
                            </div>
                        `).join('') : '<p class="text-sm text-gray-500 text-center py-4">아직 등록된 공동구매가 없습니다</p>'}
                    </div>
                </section>

                <!-- Together Posts -->
                <section class="mb-6">
                    <div class="flex items-center justify-between mb-3">
                        <div>
                            <h3 class="text-xl font-bold">같이가요</h3>
                            <p class="text-sm text-gray-600">같은 시간에 함께 방문할 사람을 찾아보세요</p>
                        </div>
                        <button class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600" onclick="createTogetherPost()">작성하기</button>
                    </div>
                    <div class="space-y-3">
                        ${gift.togetherPosts.length > 0 ? gift.togetherPosts.map(post => `
                            <div class="bg-gray-50 p-4 rounded-lg cursor-pointer hover:bg-gray-100" onclick="showTogetherDetail(${post.id})">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="font-semibold">${post.nickname}</span>
                                    <span class="text-xs text-gray-500">${getTimeAgo(post.created_at)}</span>
                                </div>
                                <h4 class="font-bold mb-2">${post.title}</h4>
                                <p class="text-sm text-gray-700 mb-3">${post.content}</p>
                                <div class="flex items-center gap-4 text-xs text-gray-500">
                                    <span><i class="far fa-calendar"></i> ${post.visit_date}</span>
                                    <span><i class="far fa-clock"></i> ${post.visit_time}</span>
                                    <span><i class="fas fa-users"></i> ${post.people_count}</span>
                                </div>
                            </div>
                        `).join('') : '<p class="text-sm text-gray-500 text-center py-4">아직 등록된 게시글이 없습니다</p>'}
                    </div>
                </section>
            </div>
        `;
        
        // Show detail page
        document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
        document.getElementById('detailPage').classList.remove('hidden');
    } catch (error) {
        console.error('Failed to load gift detail:', error);
    }
}

// Load together posts
async function loadTogetherPosts() {
    try {
        const response = await axios.get('/api/together-posts');
        const posts = response.data.data;
        
        const container = document.getElementById('togetherCards');
        container.innerHTML = posts.map(post => `
            <div class="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition" onclick="showTogetherDetail(${post.id})">
                <div class="flex items-center justify-between mb-2">
                    <span class="font-semibold">${post.nickname}</span>
                    <span class="text-xs text-gray-500">${getTimeAgo(post.created_at)}</span>
                </div>
                <h4 class="font-bold mb-2">${post.title}</h4>
                <p class="text-sm text-gray-700 mb-3 line-clamp-2">${post.content}</p>
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4 text-xs text-gray-500">
                        <span><i class="far fa-calendar"></i> ${post.visit_date}</span>
                        <span><i class="far fa-clock"></i> ${post.visit_time}</span>
                        <span><i class="fas fa-users"></i> ${post.people_count}</span>
                    </div>
                    <div class="text-xs text-gray-500">
                        <i class="far fa-heart"></i> ${post.likes}
                    </div>
                </div>
                <div class="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-600">
                    <i class="fas fa-map-marker-alt"></i> ${post.store_name} · ${post.store_address}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load together posts:', error);
    }
}

// Show together post detail
async function showTogetherDetail(postId) {
    try {
        const response = await axios.get(\`/api/together-posts/\${postId}\`);
        const post = response.data.data;
        
        document.getElementById('detailContent').innerHTML = `
            <div class="p-4">
                <div class="mb-4">
                    <div class="flex items-center justify-between mb-2">
                        <span class="font-semibold">${post.nickname}</span>
                        <span class="text-xs text-gray-500">${getTimeAgo(post.created_at)}</span>
                    </div>
                    <h2 class="text-2xl font-bold mb-3">${post.title}</h2>
                </div>

                <div class="bg-blue-50 p-4 rounded-lg mb-4 flex items-center justify-around text-sm">
                    <div class="text-center">
                        <i class="far fa-calendar block mb-1 text-blue-600"></i>
                        <span>${post.visit_date}</span>
                    </div>
                    <div class="text-center">
                        <i class="far fa-clock block mb-1 text-blue-600"></i>
                        <span>${post.visit_time}</span>
                    </div>
                    <div class="text-center">
                        <i class="fas fa-users block mb-1 text-blue-600"></i>
                        <span>${post.people_count}</span>
                    </div>
                </div>

                <p class="text-gray-700 mb-6 whitespace-pre-line">${post.content}</p>

                <!-- Store Info -->
                <section class="mb-6">
                    <h4 class="text-lg font-bold mb-2">장소 정보</h4>
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <p class="font-semibold mb-1">${post.store_name}</p>
                        <p class="text-sm text-gray-600 mb-3">${post.store_address}</p>
                        <button class="w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                            <i class="fas fa-map-marked-alt"></i> 네이버지도에서 보기
                        </button>
                    </div>
                </section>

                <!-- Author Info -->
                <section class="mb-6">
                    <h4 class="text-lg font-bold mb-2">작성자 정보</h4>
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <div class="grid grid-cols-3 gap-4 mb-3">
                            <div>
                                <span class="text-xs text-gray-500 block">성별</span>
                                <span class="font-semibold">${post.author_info.gender}</span>
                            </div>
                            <div>
                                <span class="text-xs text-gray-500 block">연령대</span>
                                <span class="font-semibold">${post.author_info.age}</span>
                            </div>
                            <div>
                                <span class="text-xs text-gray-500 block">직업</span>
                                <span class="font-semibold">${post.author_info.job}</span>
                            </div>
                        </div>
                        <p class="text-sm text-gray-700">${post.author_info.intro}</p>
                    </div>
                </section>

                <div class="flex items-center justify-between mb-6">
                    <div class="flex gap-2">
                        <button class="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                            <i class="far fa-heart"></i> ${post.likes}
                        </button>
                        <button class="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                            <i class="fas fa-share-alt"></i> 공유
                        </button>
                    </div>
                    <button class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600" onclick="applyTogetherPost(${post.id})">신청하기</button>
                </div>
            </div>
        `;
        
        // Show detail page
        document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
        document.getElementById('detailPage').classList.remove('hidden');
    } catch (error) {
        console.error('Failed to load together post detail:', error);
    }
}

// Helper functions
function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 60) return \`\${diffMins}분 전\`;
    if (diffHours < 24) return \`\${diffHours}시간 전\`;
    return \`\${diffDays}일 전\`;
}

function getTimeRemaining(expiresAt) {
    const expires = new Date(expiresAt);
    const now = new Date();
    const diffMs = expires - now;
    const diffHours = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor((diffMs % 3600000) / 60000);
    
    if (diffMs < 0) return '종료됨';
    return \`\${diffHours}시간 \${diffMins}분\`;
}

// Placeholder functions for actions
function createGroupBuy() {
    alert('공동구매 생성 기능은 로그인이 필요합니다.');
}

function joinGroupBuy(id) {
    alert('공동구매 참여 기능은 로그인이 필요합니다.');
}

function createTogetherPost() {
    alert('같이가요 작성 기능은 로그인이 필요합니다.');
}

function applyTogetherPost(id) {
    alert('같이가요 신청 기능은 로그인이 필요합니다.');
}
