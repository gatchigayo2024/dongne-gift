// 🔥 버전 확인 (즉시 실행)
console.log('💾 main.js LOADED - VERSION: FINAL-100 (localStorage 저장/복원)');

// 🔥 sampleGifts localStorage 저장/복원 함수
function saveSampleGifts() {
    localStorage.setItem('sampleGifts', JSON.stringify(sampleGifts));
    console.log('✅ 동네선물 데이터 저장됨 (공동구매 포함)');
}

function restoreSampleGifts() {
    const saved = localStorage.getItem('sampleGifts');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // 기존 sampleGifts와 병합 (새 데이터 우선)
            parsed.forEach(savedGift => {
                const existingGift = sampleGifts.find(g => g.id === savedGift.id);
                if (existingGift) {
                    // groupBuys 복원 (null이 아니면 모두 복원)
                    if (savedGift.groupBuys !== undefined && savedGift.groupBuys !== null) {
                        existingGift.groupBuys = savedGift.groupBuys;
                        console.log(`  - Gift ${savedGift.id}: ${savedGift.groupBuys.length}개 공동구매 복원`);
                    }
                    // togetherPosts 복원
                    if (savedGift.togetherPosts !== undefined && savedGift.togetherPosts !== null) {
                        existingGift.togetherPosts = savedGift.togetherPosts;
                        console.log(`  - Gift ${savedGift.id}: ${savedGift.togetherPosts.length}개 같이가요 복원`);
                    }
                }
            });
            console.log('✅ 동네선물 데이터 복원 완료');
        } catch (e) {
            console.error('❌ 동네선물 데이터 복원 실패:', e);
        }
    }
}

// 전역 변수
let currentSlideIndex = {};
let selectedEmpathy = null;
let currentGiftId = null;
let currentVoucherCode = null;
let previousPage = null; // 뒤로 가기를 위한 이전 페이지 추적

// 로그인 상태 관리
let currentUser = null; // { phoneNumber, nickname }
let isLoggedIn = false;

// 사용자 작성 후기 저장 (실제로는 서버에 저장)
let userReviews = [];

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async function() {
    // 🔥 API에서 데이터 로드
    await loadGiftsFromAPI();
    await loadTogetherPostsFromAPI();
    
    // 🔥 동네선물 데이터 복원 (공동구매 포함) - 백업용
    // restoreSampleGifts();
    
    // 로그인 상태 복원
    restoreLoginState();
    
    renderGiftCards();
    renderTogetherCards();
    renderPurchaseHistory();
});

// 경험선물 카드 렌더링
function renderGiftCards() {
    const container = document.getElementById('giftCards');
    if (!container) return;
    
    container.innerHTML = '';
    
    sampleGifts.forEach(gift => {
        const card = createGiftCard(gift);
        container.appendChild(card);
    });
}

// 경험선물 카드 생성
function createGiftCard(gift) {
    const card = document.createElement('div');
    card.className = 'gift-card';
    card.onclick = () => showDetail(gift.id);
    
    // 이미지 슬라이더
    const slider = createImageSlider(gift.id, gift.images);
    
    // 카드 정보
    const cardInfo = document.createElement('div');
    cardInfo.className = 'card-info';
    // 환급률 계산 (일반 환급 ~ 공동구매 환급)
    let refundText = '';
    if (gift.groupBuys === null) {
        // 공동구매 없음
        refundText = `${gift.discountRate}% 환급`;
    } else {
        // 공동구매 있음
        const groupBuyRate = gift.groupBuys && gift.groupBuys.length > 0 
            ? gift.groupBuys[0].discountRate 
            : gift.discountRate + 5;
        refundText = `${gift.discountRate}%~${groupBuyRate}% 환급`;
    }
    
    cardInfo.innerHTML = `
        <p class="store-intro">${gift.storeIntro}</p>
        <div class="product-price-row">
            <h2 class="product-name">${gift.productName}</h2>
            <div class="discount-badge">${refundText}</div>
        </div>
        <div class="store-price-row">
            <p class="store-location-text">
                <span class="store-name">${gift.storeName}</span> · ${gift.location}
            </p>
        </div>
        <div class="card-actions">
            <div class="action-group">
                <div class="action-item" onclick="event.stopPropagation(); toggleLike(${gift.id})">
                    <i class="${userLikes.gifts.includes(gift.id) ? 'fas' : 'far'} fa-heart" style="color: ${userLikes.gifts.includes(gift.id) ? 'var(--primary-color)' : 'inherit'}"></i>
                    <span>${gift.likes}</span>
                </div>
                <div class="action-item">
                    <i class="fas fa-shopping-cart"></i>
                    <span>${gift.purchases}</span>
                </div>
            </div>
            <button class="share-button" onclick="event.stopPropagation(); shareGift(${gift.id})">
                <i class="fas fa-share-alt"></i>
            </button>
        </div>
    `;
    
    card.appendChild(slider);
    card.appendChild(cardInfo);
    
    return card;
}

// 이미지 슬라이더 생성
function createImageSlider(id, images) {
    const sliderWrapper = document.createElement('div');
    sliderWrapper.className = 'image-slider';
    
    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'slider-container';
    sliderContainer.id = `slider-${id}`;
    
    images.forEach(img => {
        const imgElement = document.createElement('img');
        imgElement.src = img;
        imgElement.alt = '상품 이미지';
        imgElement.className = 'slider-image';
        sliderContainer.appendChild(imgElement);
    });
    
    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'slider-dots';
    dotsContainer.id = `dots-${id}`;
    
    images.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.className = `dot ${index === 0 ? 'active' : ''}`;
        dotsContainer.appendChild(dot);
    });
    
    sliderWrapper.appendChild(sliderContainer);
    sliderWrapper.appendChild(dotsContainer);
    
    // 슬라이드 인덱스 초기화
    currentSlideIndex[id] = 0;
    
    // 터치/드래그 이벤트 추가
    if (images.length > 1) {
        setupSliderSwipe(sliderContainer, id, images.length);
    }
    
    return sliderWrapper;
}

// 슬라이더 스와이프 기능 설정
function setupSliderSwipe(slider, id, totalImages) {
    // 기존 이벤트 제거를 위한 플래그
    slider.setAttribute('data-swipe-id', id);
    
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    let isDragging = false;
    let isHorizontal = null;
    
    const handleStart = (e) => {
        startX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
        startY = e.type.includes('mouse') ? e.pageY : e.touches[0].pageY;
        isDragging = true;
        isHorizontal = null;
        slider.style.transition = 'none';
    };
    
    const handleMove = (e) => {
        if (!isDragging) return;
        
        currentX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
        currentY = e.type.includes('mouse') ? e.pageY : e.touches[0].pageY;
        
        const diffX = Math.abs(currentX - startX);
        const diffY = Math.abs(currentY - startY);
        
        // 방향 결정 (처음 움직임으로만 판단)
        if (isHorizontal === null && (diffX > 5 || diffY > 5)) {
            isHorizontal = diffX > diffY;
        }
        
        // 수평 스와이프만 처리
        if (isHorizontal) {
            e.preventDefault();
            const diff = currentX - startX;
            const currentTransform = -currentSlideIndex[id] * 100;
            slider.style.transform = `translateX(${currentTransform + (diff / slider.offsetWidth) * 100}%)`;
        }
    };
    
    const handleEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        slider.style.transition = 'transform 0.3s ease-in-out';
        
        // 수평 스와이프였을 때만 슬라이드 전환
        if (isHorizontal) {
            const diff = currentX - startX;
            const threshold = slider.offsetWidth * 0.3; // 30%로 증가
            
            if (Math.abs(diff) > threshold) {
                if (diff > 0) {
                    moveSlide(id, totalImages, -1);
                } else {
                    moveSlide(id, totalImages, 1);
                }
            } else {
                slider.style.transform = `translateX(-${currentSlideIndex[id] * 100}%)`;
            }
        } else {
            // 수직 스크롤이었으면 원위치
            slider.style.transform = `translateX(-${currentSlideIndex[id] * 100}%)`;
        }
        
        isHorizontal = null;
    };
    
    // 마우스 이벤트
    slider.addEventListener('mousedown', handleStart);
    slider.addEventListener('mousemove', handleMove);
    slider.addEventListener('mouseup', handleEnd);
    slider.addEventListener('mouseleave', handleEnd);
    
    // 터치 이벤트
    slider.addEventListener('touchstart', handleStart, { passive: true });
    slider.addEventListener('touchmove', handleMove, { passive: false });
    slider.addEventListener('touchend', handleEnd);
}

// 슬라이더 이동
function moveSlide(id, totalImages, direction) {
    const slider = document.getElementById(`slider-${id}`);
    const dots = document.getElementById(`dots-${id}`);
    
    currentSlideIndex[id] = (currentSlideIndex[id] + direction + totalImages) % totalImages;
    
    slider.style.transform = `translateX(-${currentSlideIndex[id] * 100}%)`;
    
    // 도트 업데이트
    const dotElements = dots.querySelectorAll('.dot');
    dotElements.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlideIndex[id]);
    });
}

// 상세 페이지 표시
async function showDetail(giftId) {
    // Load gift details from API
    let gift = sampleGifts.find(g => g.id === giftId);
    if (!gift) return;
    
    // Fetch detailed info from API
    try {
        const response = await fetch(`/api/gifts/${giftId}`);
        const data = await response.json();
        if (data.success) {
            const apiGift = data.data;
            // Update gift with API data
            gift.comments = apiGift.comments.map(c => ({
                nickname: c.nickname,
                date: c.created_at ? c.created_at.split(' ')[0] : c.created_at, // Extract date only (YYYY-MM-DD)
                purchases: 1,
                comment: c.comment,
                empathy: c.empathy
            }));
            gift.groupBuys = apiGift.groupBuys.map(gb => ({
                id: gb.id,
                createdAt: gb.created_at,
                discountRate: gb.discount_rate,
                users: [
                    { initial: gb.creator_nickname[0], color: "#4A90E2" }
                ],
                isComplete: gb.is_complete === 1,
                endTime: gb.expires_at ? new Date(gb.expires_at) : null
            }));
            // Add partner user if exists
            apiGift.groupBuys.forEach((gb, index) => {
                if (gb.partner_nickname) {
                    gift.groupBuys[index].users.push({
                        initial: gb.partner_nickname[0],
                        color: "#5B7FE8"
                    });
                }
            });
            gift.togetherPosts = apiGift.togetherPosts.map(tp => ({
                id: tp.id,
                nickname: tp.nickname,
                time: getTimeAgo(tp.created_at),
                title: tp.title,
                content: tp.content,
                date: tp.visit_date,
                time: tp.visit_time,
                people: tp.people_count,
                storeName: apiGift.store_name,
                storeAddress: apiGift.address,
                likes: tp.likes
            }));
            
            // 🔥 중요: sampleGifts 배열 업데이트 (페이지 이동 후에도 데이터 유지)
            const giftIndex = sampleGifts.findIndex(g => g.id === giftId);
            if (giftIndex !== -1) {
                sampleGifts[giftIndex] = gift;
                saveSampleGifts(); // localStorage에도 저장
            }
            console.log('✅ API에서 최신 데이터 로드 완료:', giftId);
        }
    } catch (error) {
        console.error('Failed to load gift details:', error);
    }
    
    currentGiftId = giftId;
    
    // 이전 페이지 추적
    if (document.getElementById('mainPage').classList.contains('active')) {
        previousPage = 'mainPage';
    } else if (document.getElementById('myLikesPage').classList.contains('active')) {
        previousPage = 'myLikesPage';
    }
    
    // 페이지 전환
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('detailPage').classList.add('active');
    
    // 하단 네비게이션 숨기기
    const bottomNav = document.querySelector('.bottom-nav');
    if (bottomNav) bottomNav.style.display = 'none';
    
    // 상세 정보 채우기
    document.getElementById('detailStoreIntro').textContent = gift.storeIntro;
    document.getElementById('detailProductName').textContent = gift.productName;
    
    // 가격 정보 (좌측: 가격, 우측: 환급률)
    const priceText = `${formatPrice(gift.discountedPrice)}`;
    document.getElementById('detailPrice').textContent = priceText;
    
    // 환급률 - 기본 구매 환급률만 표시 (공동구매 환급률은 공동구매 섹션에서 표시)
    const refundRateText = `${gift.discountRate}% 환급`;
    document.getElementById('detailRefundRate').textContent = refundRateText;
    
    document.getElementById('detailDescription').textContent = gift.description;
    document.getElementById('detailStoreName').textContent = gift.storeName;
    document.getElementById('detailStoreAddress').textContent = gift.address;
    
    // 이미지 슬라이더
    renderDetailSlider(gift.images);
    
    // 코멘트 렌더링
    renderCommentsInDetail(gift.comments);
    
    // 스크롤 트리거 설정
    setupCommentsScrollTrigger();
    
    // 공동구매 카드 렌더링
    console.log('🔍 공동구매 데이터:', gift.groupBuys);
    renderGroupBuyCards(gift.groupBuys);
    
    // 같이가요 카드 렌더링
    console.log('🔍 같이가요 데이터:', gift.togetherPosts);
    renderTogetherCardsInDetail(gift.togetherPosts || []);
    
    window.scrollTo(0, 0);
}

// 상세 페이지 슬라이더 렌더링
function renderDetailSlider(images) {
    const slider = document.getElementById('detailSlider');
    const dots = document.getElementById('detailSliderDots');
    
    // 기존 이벤트 리스너 제거를 위해 슬라이더 복제
    const newSlider = slider.cloneNode(false);
    slider.parentNode.replaceChild(newSlider, slider);
    
    newSlider.innerHTML = '';
    dots.innerHTML = '';
    
    images.forEach((img, index) => {
        const imgElement = document.createElement('img');
        imgElement.src = img;
        imgElement.alt = '상품 이미지';
        imgElement.className = 'slider-image';
        newSlider.appendChild(imgElement);
        
        const dot = document.createElement('span');
        dot.className = `dot ${index === 0 ? 'active' : ''}`;
        dots.appendChild(dot);
    });
    
    currentSlideIndex['detail'] = 0;
    newSlider.style.transform = 'translateX(0)';
    newSlider.style.transition = 'transform 0.3s ease-in-out';
    
    // 터치/드래그 이벤트 추가
    if (images.length > 1) {
        setupDetailSliderSwipe(newSlider, images.length);
    }
}

// 상세 페이지 슬라이더 스와이프 기능
function setupDetailSliderSwipe(slider, totalImages) {
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    let isDragging = false;
    let isHorizontal = null;
    
    const handleStart = (e) => {
        startX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
        startY = e.type.includes('mouse') ? e.pageY : e.touches[0].pageY;
        isDragging = true;
        isHorizontal = null;
        slider.style.transition = 'none';
    };
    
    const handleMove = (e) => {
        if (!isDragging) return;
        
        currentX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
        currentY = e.type.includes('mouse') ? e.pageY : e.touches[0].pageY;
        
        const diffX = Math.abs(currentX - startX);
        const diffY = Math.abs(currentY - startY);
        
        // 방향 결정 (처음 움직임으로만 판단)
        if (isHorizontal === null && (diffX > 5 || diffY > 5)) {
            isHorizontal = diffX > diffY;
        }
        
        // 수평 스와이프만 처리
        if (isHorizontal) {
            e.preventDefault();
            const diff = currentX - startX;
            const currentTransform = -currentSlideIndex['detail'] * 100;
            slider.style.transform = `translateX(${currentTransform + (diff / slider.offsetWidth) * 100}%)`;
        }
    };
    
    const handleEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        slider.style.transition = 'transform 0.3s ease-in-out';
        
        // 수평 스와이프였을 때만 슬라이드 전환
        if (isHorizontal) {
            const diff = currentX - startX;
            const threshold = slider.offsetWidth * 0.3; // 30%로 증가
            
            if (Math.abs(diff) > threshold) {
                if (diff > 0) {
                    moveDetailSlide(-1);
                } else {
                    moveDetailSlide(1);
                }
            } else {
                slider.style.transform = `translateX(-${currentSlideIndex['detail'] * 100}%)`;
            }
        } else {
            // 수직 스크롤이었으면 원위치
            slider.style.transform = `translateX(-${currentSlideIndex['detail'] * 100}%)`;
        }
        
        isHorizontal = null;
    };
    
    slider.addEventListener('mousedown', handleStart);
    slider.addEventListener('mousemove', handleMove);
    slider.addEventListener('mouseup', handleEnd);
    slider.addEventListener('mouseleave', handleEnd);
    
    slider.addEventListener('touchstart', handleStart, { passive: true });
    slider.addEventListener('touchmove', handleMove, { passive: false });
    slider.addEventListener('touchend', handleEnd);
}

// 상세 페이지 슬라이더 이동
function moveDetailSlide(direction) {
    const slider = document.getElementById('detailSlider');
    const dots = document.getElementById('detailSliderDots');
    const images = slider.querySelectorAll('.slider-image');
    const totalImages = images.length;
    
    currentSlideIndex['detail'] = (currentSlideIndex['detail'] + direction + totalImages) % totalImages;
    
    slider.style.transform = `translateX(-${currentSlideIndex['detail'] * 100}%)`;
    
    const dotElements = dots.querySelectorAll('.dot');
    dotElements.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlideIndex['detail']);
    });
}

// 코멘트 렌더링 (상세 페이지용)
function renderCommentsInDetail(comments) {
    const container = document.getElementById('detailComments');
    
    if (!container) return;
    
    container.innerHTML = '';
    
    // 현재 상품의 사용자 후기 가져오기
    const gift = sampleGifts.find(g => g.id === currentGiftId);
    const userCommentsForThisGift = userReviews.filter(r => r.giftId === gift.id);
    
    // 사용자 후기를 먼저 추가 (최신순)
    userCommentsForThisGift.forEach((comment) => {
        const commentItem = createCommentElement(comment, false);
        container.appendChild(commentItem);
    });
    
    // 기존 코멘트 추가
    comments.forEach((comment) => {
        const commentItem = createCommentElement(comment, false);
        container.appendChild(commentItem);
    });
}

// 코멘트 박스 스크롤 트리거 설정
function setupCommentsScrollTrigger() {
    const trigger = document.getElementById('commentsScrollTrigger');
    const container = document.getElementById('detailCommentsContainer');
    const box = document.getElementById('detailCommentsBox');
    
    if (!trigger || !container || !box) return;
    
    // 트리거 영역에 마우스가 들어오면 스크롤 활성화
    trigger.addEventListener('mouseenter', () => {
        container.classList.add('scroll-enabled');
    });
    
    // 트리거 영역을 벗어나면 스크롤 비활성화
    trigger.addEventListener('mouseleave', () => {
        container.classList.remove('scroll-enabled');
    });
    
    // 컨테이너의 휠 이벤트 처리
    container.addEventListener('wheel', (e) => {
        if (container.classList.contains('scroll-enabled')) {
            // 스크롤 영역 내에서만 이벤트 전파 중지
            e.stopPropagation();
            
            // 스크롤 한계 체크
            const atTop = container.scrollTop === 0;
            const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 1;
            
            // 스크롤 한계에서 페이지 스크롤 허용
            if ((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0)) {
                return; // 페이지 스크롤 허용
            }
            
            e.preventDefault(); // 페이지 스크롤 방지
        }
    }, { passive: false });
}

// 코멘트 렌더링 (모달용)
function renderComments(containerId, comments, isModal = false) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    // gift.comments만 사용 (userReviews는 이미 동기화되어 있음)
    let commentIndex = 0;
    
    comments.forEach((comment) => {
        const commentItem = createCommentElement(comment, isModal, commentIndex);
        container.appendChild(commentItem);
        commentIndex++;
    });
    
    console.log('✅ renderComments() 실행:', comments.length, '개 후기 렌더링');
}

// 코멘트 엘리먼트 생성
function createCommentElement(comment, isModal = false, index = 0) {
    const commentItem = document.createElement('div');
    commentItem.className = comment.isNew ? 'comment-item new-review' : 'comment-item';
    
    const newBadge = comment.isNew ? '<span class="new-badge">NEW</span>' : '';
    
    commentItem.innerHTML = `
        <div class="comment-header">
            <div class="comment-meta">
                <span>${comment.nickname}</span>
                ${newBadge}
                <span>·</span>
                <span>${comment.date}</span>
                <span>·</span>
                <span>${comment.purchases}장 구매</span>
            </div>
        </div>
        <div class="comment-text">
            <i class="fas fa-comment-dots"></i>
            <p>${comment.comment}</p>
        </div>
        <div class="comment-footer">
            <button class="empathy-button" onclick="${isModal ? `selectEmpathy(${index})` : ''}">
                <i class="far fa-thumbs-up"></i>
                <span>공감 ${comment.empathy}</span>
            </button>
        </div>
    `;
    return commentItem;
}

// 공동구매 카드 렌더링
function renderGroupBuyCards(groupBuys) {
    const section = document.querySelector('.group-buy-section');
    const container = document.getElementById('detailGroupBuyCards');
    
    if (!container || !section) return;
    
    // groupBuys가 null이면 섹션 자체를 숨김
    if (groupBuys === null) {
        section.style.display = 'none';
        return;
    }
    
    section.style.display = 'block';
    container.innerHTML = '';
    
    if (groupBuys.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">아직 공동구매 진행 중인 건이 없습니다.</p>';
        return;
    }
    
    groupBuys.forEach(groupBuy => {
        const card = createGroupBuyCard(groupBuy);
        container.appendChild(card);
    });
    
    // 카운트다운 시작
    startCountdowns();
}

// 공동구매 카드 생성
function createGroupBuyCard(groupBuy) {
    const card = document.createElement('div');
    card.className = 'group-buy-card';
    
    // 유저 아바타 생성
    let avatarsHTML = '<div class="user-avatars">';
    groupBuy.users.forEach(user => {
        avatarsHTML += `<div class="user-avatar" style="background-color: ${user.color}">${user.initial}</div>`;
    });
    
    // 미완료 시 빈 아바타 추가
    if (!groupBuy.isComplete) {
        avatarsHTML += '<div class="user-avatar empty">+</div>';
    }
    avatarsHTML += '</div>';
    
    // 액션 버튼 및 카운트다운
    let actionHTML = '<div class="group-buy-action">';
    if (!groupBuy.isComplete) {
        // 🔥 endTime이 문자열이면 Date 객체로 변환
        const endTimeValue = groupBuy.endTime instanceof Date 
            ? groupBuy.endTime.getTime() 
            : new Date(groupBuy.endTime).getTime();
        actionHTML += `<div class="countdown-timer" data-endtime="${endTimeValue}">00:00:00</div>`;
        actionHTML += '<button class="join-button" onclick="joinGroupBuy(' + groupBuy.id + ')">공동구매 신청</button>';
    } else {
        actionHTML += '<button class="success-button">공동구매 성공</button>';
    }
    actionHTML += '</div>';
    
    card.innerHTML = `
        <div class="group-buy-header">
            <span class="group-buy-discount">${groupBuy.discountRate}% 환급</span>
            <span class="group-buy-time">${groupBuy.createdAt}</span>
        </div>
        <div class="group-buy-content">
            <div class="group-buy-users">
                ${avatarsHTML}
            </div>
            ${actionHTML}
        </div>
    `;
    
    return card;
}

// 카운트다운 시작
function startCountdowns() {
    const timers = document.querySelectorAll('.countdown-timer');
    
    function updateCountdowns() {
        timers.forEach(timer => {
            const endTime = parseInt(timer.getAttribute('data-endtime'));
            const now = Date.now();
            const remaining = endTime - now;
            
            if (remaining <= 0) {
                timer.textContent = '00:00:00';
                return;
            }
            
            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
            
            timer.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        });
    }
    
    updateCountdowns();
    setInterval(updateCountdowns, 1000);
}

// 공동구매 신청
// 공동구매 카드에서 신청 버튼 클릭 시
let currentJoiningGroupBuyId = null;

function joinGroupBuy(id) {
    currentJoiningGroupBuyId = id;
    
    const gift = sampleGifts.find(g => g.id === currentGiftId);
    if (!gift || !gift.groupBuys) return;
    
    const groupBuy = gift.groupBuys.find(gb => gb.id === id);
    if (!groupBuy) return;
    
    // 이미 완료된 공동구매인지 확인
    if (groupBuy.isComplete) {
        alert('이미 완료된 공동구매입니다.');
        return;
    }
    
    // 공동구매 모달 열기 (상단 +신청하기와 동일)
    createGroupBuy();
}

// 기존 joinGroupBuy 로직을 별도 함수로 분리
function processJoinGroupBuy(id) {
    const gift = sampleGifts.find(g => g.id === currentGiftId);
    if (!gift || !gift.groupBuys) return;
    
    const groupBuy = gift.groupBuys.find(gb => gb.id === id);
    if (!groupBuy) return;
    
    // 사용자 추가
    groupBuy.users.push({ 
        initial: "참", 
        color: "#6C8FD9" 
    });
    
    // 2명이 모집되면 완료 처리
    if (groupBuy.users.length >= 2) {
        groupBuy.isComplete = true;
        groupBuy.endTime = null;
    }
    
    // 화면 업데이트
    renderGroupBuyCards(gift.groupBuys);
    
    if (groupBuy.isComplete) {
        alert('공동구매가 성공적으로 완료되었습니다!\n\n결제를 진행해주세요.');
    } else {
        alert('공동구매 신청이 완료되었습니다!\n\n모집이 완료되면 알림을 보내드립니다.');
        startCountdowns();
    }
}

// 같이가요 카드 렌더링 (상세페이지)
function renderTogetherCardsInDetail(posts) {
    const container = document.getElementById('detailTogetherCards');
    if (!container) return;
    
    container.innerHTML = '';
    
    // 🔥 posts가 없거나 배열이 아니면 빈 메시지
    if (!posts || !Array.isArray(posts) || posts.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">아직 같이가요 게시글이 없습니다.</p>';
        return;
    }
    
    posts.forEach(post => {
        const card = createTogetherCard(post);
        container.appendChild(card);
    });
    
    console.log('✅ 같이가요 카드 렌더링:', posts.length, '개');
}

// 같이가요 카드 생성
function createTogetherCard(post) {
    const card = document.createElement('div');
    card.className = 'together-card';
    card.onclick = () => showTogetherDetail(post.id);
    card.style.cursor = 'pointer';
    card.innerHTML = `
        <div class="together-header">
            <span class="together-nickname">${post.nickname}</span>
            <span class="together-time">${post.time}</span>
        </div>
        <h3 class="together-title">${post.title}</h3>
        <p class="together-content">${post.content}</p>
        <div class="together-details">
            <div class="together-detail">
                <i class="far fa-calendar"></i>
                <span>${post.date}</span>
            </div>
            <div class="together-detail">
                <i class="far fa-clock"></i>
                <span>${post.time}</span>
            </div>
            <div class="together-detail">
                <i class="fas fa-users"></i>
                <span>${post.people}</span>
            </div>
            <div class="together-detail">
                <i class="fas fa-map-marker-alt"></i>
                <span>${post.storeName} · ${post.storeAddress}</span>
            </div>
        </div>
        <div class="together-actions">
            <div class="together-like" onclick="event.stopPropagation(); toggleTogetherLike(${post.id})">
                <i class="${userLikes.togetherPosts.includes(post.id) ? 'fas' : 'far'} fa-heart" style="color: ${userLikes.togetherPosts.includes(post.id) ? 'var(--primary-color)' : 'inherit'}"></i>
                <span>${post.likes}</span>
            </div>
            <button class="recruit-button" onclick="event.stopPropagation();">모집 중</button>
        </div>
    `;
    return card;
}

// 같이가요 메인 렌더링
function renderTogetherCards() {
    const container = document.getElementById('togetherCards');
    if (!container) return;
    
    container.innerHTML = '';
    
    togetherPosts.forEach(post => {
        const card = createTogetherCard(post);
        container.appendChild(card);
    });
}

// 구매 내역 렌더링
// 구매 내역에서 상세 페이지로 이동
function openPurchaseDetail(giftId) {
    // 마이페이지 닫기
    document.getElementById('myPage').classList.remove('active');
    
    // 상세 페이지 열기
    showDetail(giftId);
}

function renderPurchaseHistory() {
    const container = document.getElementById('purchaseCards');
    if (!container) return;
    
    container.innerHTML = '';
    
    purchaseHistory.forEach(purchase => {
        const card = document.createElement('div');
        card.className = 'purchase-card';
        card.innerHTML = `
            <div class="purchase-card-clickable" onclick="openPurchaseDetail(${purchase.giftId})">
                <img src="${purchase.image}" alt="${purchase.storeName}" class="purchase-card-image">
                <div class="purchase-card-info">
                    <p class="store-intro">${purchase.storeIntro}</p>
                    <div class="product-price-row">
                        <h3 class="product-name">${purchase.productName}</h3>
                        <div class="discount-badge">${purchase.discountRate}% 환급</div>
                    </div>
                    <div class="store-price-row">
                        <p class="store-location-text">
                            <span class="store-name">${purchase.storeName}</span> · ${purchase.location}
                        </p>
                    </div>
                </div>
            </div>
            <div class="voucher-section">
                <div class="voucher-row">
                    <div class="voucher-code">
                        <i class="fas fa-ticket-alt"></i>
                        <span>${purchase.voucherCode}</span>
                    </div>
                    <button class="gift-button" onclick="event.stopPropagation(); giftVoucher('${purchase.voucherCode}')">
                        친구에게 선물하기 <i class="fas fa-gift"></i>
                    </button>
                </div>
                <button class="review-button" onclick="event.stopPropagation(); writeReview('${purchase.voucherCode}')">
                    후기 작성 후 환급 받기 <i class="fas fa-chevron-right"></i>
                </button>
                <p class="expiry-date">유효기간: ${purchase.expiryDate}까지</p>
            </div>
        `;
        container.appendChild(card);
    });
}

// 구매 모달 열기
function openPurchaseModal() {
    // 로그인 체크
    if (!checkLoginRequired()) return;
    
    if (!currentGiftId) return;
    
    const gift = sampleGifts.find(g => g.id === currentGiftId);
    if (!gift) return;
    
    const modal = document.getElementById('purchaseModal');
    modal.classList.add('active');
    
    // 코멘트 렌더링 (항상 최신 gift.comments 사용)
    console.log('🔄 구매 모달 열림 - 후기 개수:', gift.comments.length);
    renderComments('modalComments', gift.comments, true);
    
    // 🔍 디버깅: 모달 상단에 후기 개수 표시
    const modalTitle = modal.querySelector('.purchase-modal-header h2');
    if (modalTitle) {
        modalTitle.innerHTML = `구매하기 <span style="color: #666; font-size: 14px;">(후기 ${gift.comments.length}개)</span>`;
    }
    
    // 수량 초기화
    document.getElementById('quantity').value = 1;
    
    // 총 결제금액 0원으로 고정
    document.getElementById('totalPrice').textContent = '0원';
    
    // 공감 선택 초기화
    selectedEmpathy = null;
    updatePaymentButton();
}

// 구매 모달 닫기
function closePurchaseModal() {
    const modal = document.getElementById('purchaseModal');
    modal.classList.remove('active');
    selectedEmpathy = null;
}

// 수량 증가
function increaseQuantity() {
    const input = document.getElementById('quantity');
    input.value = parseInt(input.value) + 1;
    // 가격은 항상 0원
    document.getElementById('totalPrice').textContent = '0원';
}

// 수량 감소
function decreaseQuantity() {
    const input = document.getElementById('quantity');
    const current = parseInt(input.value);
    if (current > 1) {
        input.value = current - 1;
        // 가격은 항상 0원
        document.getElementById('totalPrice').textContent = '0원';
    }
}

// 공감 선택
function selectEmpathy(index) {
    selectedEmpathy = index;
    
    // 모든 공감 버튼 비활성화
    const buttons = document.querySelectorAll('#modalComments .empathy-button');
    buttons.forEach((btn, idx) => {
        if (idx === index) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    updatePaymentButton();
}

// 결제 버튼 상태 업데이트
function updatePaymentButton() {
    const button = document.getElementById('paymentButton');
    if (selectedEmpathy !== null) {
        button.classList.remove('disabled');
        button.disabled = false;
    } else {
        button.classList.add('disabled');
        button.disabled = true;
    }
}

// 결제 처리
function processPayment() {
    if (selectedEmpathy === null) {
        alert('공감 표시를 해주세요!');
        return;
    }
    
    const gift = sampleGifts.find(g => g.id === currentGiftId);
    if (!gift) return;
    
    const quantity = parseInt(document.getElementById('quantity').value);
    
    // 구매 내역에 추가
    addToPurchaseHistory(gift, quantity, false);
    
    alert(`결제가 완료되었습니다! (${quantity}장)\n\n마이페이지 > 구매 내역에서 확인하실 수 있습니다.`);
    closePurchaseModal();
}

// 네비게이션
function navigateTo(page) {
    // 모든 페이지 숨기기
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // 모든 네비게이션 버튼 비활성화
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    // 선택된 페이지 표시
    switch(page) {
        case 'main':
            document.getElementById('mainPage').classList.add('active');
            document.querySelectorAll('.nav-item')[0].classList.add('active');
            break;
        case 'together':
            document.getElementById('togetherPage').classList.add('active');
            document.querySelectorAll('.nav-item')[1].classList.add('active');
            break;
        case 'my':
            document.getElementById('myPage').classList.add('active');
            document.querySelectorAll('.nav-item')[2].classList.add('active');
            break;
    }
    
    window.scrollTo(0, 0);
}

// 메인으로 돌아가기
function navigateToMain() {
    document.getElementById('detailPage').classList.remove('active');
    
    // 이전 페이지로 돌아가기
    if (previousPage === 'myLikesPage') {
        document.getElementById('myLikesPage').classList.add('active');
        // 현재 탭 유지하며 목록 새로고침
        const activeTab = document.querySelector('.likes-tab.active');
        if (activeTab && activeTab.textContent.includes('같이가요')) {
            renderLikedTogether();
        } else {
            renderLikedGifts();
        }
    } else {
        document.getElementById('mainPage').classList.add('active');
    }
    
    // 하단 네비게이션 다시 표시
    const bottomNav = document.querySelector('.bottom-nav');
    if (bottomNav) bottomNav.style.display = 'flex';
    
    // 이전 페이지 초기화
    previousPage = null;
    
    window.scrollTo(0, 0);
}

// 마이페이지로 돌아가기
function navigateToMyPage() {
    document.getElementById('purchaseHistoryPage').classList.remove('active');
    document.getElementById('myTogetherPage').classList.remove('active');
    document.getElementById('appliedTogetherPage').classList.remove('active');
    document.getElementById('myLikesPage').classList.remove('active');
    document.getElementById('myPage').classList.add('active');
    window.scrollTo(0, 0);
}

// 구매 내역으로 이동
function navigateToPurchaseHistory() {
    document.getElementById('myPage').classList.remove('active');
    document.getElementById('purchaseHistoryPage').classList.add('active');
    window.scrollTo(0, 0);
}

// 유틸리티 함수
function formatPrice(price) {
    return price.toLocaleString('ko-KR') + '원';
}

function toggleLike(id) {
    // 로그인 체크
    if (!checkLoginRequired()) return;
    
    const gift = sampleGifts.find(g => g.id === id);
    if (!gift) return;
    
    const likeIndex = userLikes.gifts.indexOf(id);
    
    if (likeIndex > -1) {
        // 이미 좋아요한 경우 - 취소
        userLikes.gifts.splice(likeIndex, 1);
        gift.likes = Math.max(0, gift.likes - 1);
    } else {
        // 좋아요 추가
        userLikes.gifts.push(id);
        gift.likes = (gift.likes || 0) + 1;
    }
    
    // 좋아요 데이터 저장
    if (currentUser) {
        const phoneKey = currentUser.phoneNumber.replace(/-/g, '');
        userLikesDatabase[phoneKey] = {
            gifts: [...userLikes.gifts],
            togetherPosts: [...userLikes.togetherPosts]
        };
        
        // 🔥 localStorage에도 저장
        localStorage.setItem('userLikes_' + phoneKey, JSON.stringify(userLikesDatabase[phoneKey]));
        console.log('✅ 좋아요 데이터 저장됨');
    }
    
    // 카드 UI 업데이트
    renderGiftCards();
    
    // 내 좋아요 화면이 열려있다면 업데이트
    if (document.getElementById('myLikesPage').classList.contains('active')) {
        renderLikedGifts();
    }
    
    // 상세 화면이 열려있다면 업데이트
    if (currentGiftId === id && document.getElementById('detailPage').classList.contains('active')) {
        showDetail(id);
    }
}

function toggleTogetherLike(id) {
    // 로그인 체크
    if (!checkLoginRequired()) return;
    
    const post = togetherPosts.find(p => p.id === id);
    if (!post) return;
    
    const likeIndex = userLikes.togetherPosts.indexOf(id);
    
    if (likeIndex > -1) {
        // 이미 좋아요한 경우 - 취소
        userLikes.togetherPosts.splice(likeIndex, 1);
        post.likes = Math.max(0, post.likes - 1);
    } else {
        // 좋아요 추가
        userLikes.togetherPosts.push(id);
        post.likes = (post.likes || 0) + 1;
    }
    
    // 좋아요 데이터 저장
    if (currentUser) {
        const phoneKey = currentUser.phoneNumber.replace(/-/g, '');
        userLikesDatabase[phoneKey] = {
            gifts: [...userLikes.gifts],
            togetherPosts: [...userLikes.togetherPosts]
        };
        
        // 🔥 localStorage에도 저장
        localStorage.setItem('userLikes_' + phoneKey, JSON.stringify(userLikesDatabase[phoneKey]));
        console.log('✅ 좋아요 데이터 저장됨');
    }
    
    // 🔥 같이가요 목록 localStorage에 저장 (좋아요 수 업데이트 반영)
    localStorage.setItem('togetherPosts', JSON.stringify(togetherPosts));
    
    // 카드 UI 업데이트
    renderTogetherCards();
    
    // 🔥 동네선물 상세 페이지의 같이가요 섹션이 열려있다면 업데이트
    if (document.getElementById('detailPage').classList.contains('active')) {
        const gift = sampleGifts.find(g => g.id === currentGiftId);
        if (gift && gift.togetherPosts) {
            // 🔥 gift.togetherPosts도 최신 데이터로 동기화
            gift.togetherPosts.forEach(giftPost => {
                const updatedPost = togetherPosts.find(p => p.id === giftPost.id);
                if (updatedPost) {
                    giftPost.likes = updatedPost.likes;
                }
            });
            renderTogetherCardsInDetail(gift.togetherPosts);
            console.log('✅ 상세 페이지 같이가요 카드 업데이트 (좋아요 수 동기화)');
        }
    }
    
    // 내 좋아요 화면이 열려있다면 업데이트
    if (document.getElementById('myLikesPage').classList.contains('active')) {
        renderLikedTogether();
    }
    
    // 같이가요 상세 페이지가 열려있다면 업데이트
    if (document.getElementById('togetherDetailPage').classList.contains('active')) {
        showTogetherDetail(currentTogetherPostId);
    }
}

// 같이가요 상세 페이지 표시
let currentTogetherPostId = null;
let fromPage = null; // 어디서 왔는지 추적

function showTogetherDetail(postId) {
    const post = togetherPosts.find(p => p.id === postId);
    if (!post) return;
    
    currentTogetherPostId = postId;
    
    // 현재 페이지 추적
    if (document.getElementById('togetherPage').classList.contains('active')) {
        fromPage = 'together';
    } else if (document.getElementById('detailPage').classList.contains('active')) {
        fromPage = 'detail';
    } else if (document.getElementById('myLikesPage').classList.contains('active')) {
        fromPage = 'myLikes';
    }
    
    // 모든 페이지 숨기기
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // 같이가요 상세 페이지 표시
    document.getElementById('togetherDetailPage').classList.add('active');
    
    // 하단 네비게이션 숨기기
    const bottomNav = document.querySelector('.bottom-nav');
    if (bottomNav) bottomNav.style.display = 'none';
    
    // 상세 정보 채우기
    document.getElementById('detailAuthorNickname').textContent = post.nickname;
    document.getElementById('detailPostTime').textContent = post.time;
    document.getElementById('detailTogetherTitle').textContent = post.title;
    document.getElementById('detailTogetherContent').textContent = post.content;
    document.getElementById('detailTogetherDate').textContent = post.date;
    document.getElementById('detailTogetherTime').textContent = post.time;
    document.getElementById('detailTogetherPeople').textContent = post.people;
    document.getElementById('detailTogetherStoreName').textContent = post.storeName;
    document.getElementById('detailTogetherStoreAddress').textContent = post.storeAddress;
    document.getElementById('detailTogetherLikes').textContent = post.likes || 0;
    
    // 작성자 정보 표시
    if (post.authorInfo) {
        document.getElementById('detailAuthorGender').textContent = post.authorInfo.gender;
        document.getElementById('detailAuthorAge').textContent = post.authorInfo.age;
        document.getElementById('detailAuthorJob').textContent = post.authorInfo.job;
        document.getElementById('detailAuthorIntro').textContent = post.authorInfo.intro;
        document.getElementById('authorInfoSection').style.display = 'block';
    } else {
        document.getElementById('authorInfoSection').style.display = 'none';
    }
    
    // 참여자 목록 표시 (로그인한 작성자만)
    if (isLoggedIn && currentUser && post.nickname === currentUser.nickname) {
        renderParticipantsList(post.id);
        document.getElementById('participantsSection').style.display = 'block';
    } else {
        document.getElementById('participantsSection').style.display = 'none';
    }
    
    // 하단 신청하기 버튼 상태 업데이트
    updateApplyButtonState(post.id);
    
    // 좋아요 버튼 상태 업데이트
    const likeButton = document.querySelector('.together-like-button');
    if (likeButton) {
        if (userLikes.togetherPosts.includes(postId)) {
            likeButton.classList.add('liked');
            const icon = likeButton.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-heart';
                icon.style.color = 'var(--primary-color)';
            }
        } else {
            likeButton.classList.remove('liked');
            const icon = likeButton.querySelector('i');
            if (icon) {
                icon.className = 'far fa-heart';
                icon.style.color = '';
            }
        }
    }
    
    window.scrollTo(0, 0);
}

// 신청하기 버튼 상태 업데이트
function updateApplyButtonState(postId) {
    const applyButton = document.querySelector('.together-apply-button');
    if (!applyButton) return;
    
    // 내가 이 게시글에 신청했는지 확인
    const myApplication = myApplications.find(app => app.postId === postId);
    
    if (myApplication) {
        // 신청한 경우 상태에 따라 버튼 변경
        switch(myApplication.status) {
            case 'pending':
                applyButton.textContent = '수락 대기 중';
                applyButton.style.background = '#FFA726';
                applyButton.onclick = null;
                applyButton.style.cursor = 'default';
                break;
            case 'accepted':
                applyButton.textContent = '채팅방으로 이동';
                applyButton.style.background = '#4DC9C1';
                applyButton.onclick = () => {
                    alert('채팅방 기능 (미구현)\n\n작성자와 참여 확정자들의 단체 채팅방으로 이동합니다.');
                };
                applyButton.style.cursor = 'pointer';
                break;
            case 'rejected':
                applyButton.textContent = '수락 거절됨';
                applyButton.style.background = '#E0E0E0';
                applyButton.style.color = '#9E9E9E';
                applyButton.onclick = null;
                applyButton.style.cursor = 'default';
                break;
        }
    } else {
        // 신청하지 않은 경우 기본 상태
        applyButton.textContent = '신청하기';
        applyButton.style.background = '';
        applyButton.style.color = '';
        applyButton.onclick = applyTogetherPost;
        applyButton.style.cursor = 'pointer';
    }
}

// 같이가요 상세에서 좋아요 토글
function toggleTogetherDetailLike() {
    // 로그인 체크
    if (!checkLoginRequired()) return;
    
    if (!currentTogetherPostId) return;
    
    const post = togetherPosts.find(p => p.id === currentTogetherPostId);
    if (!post) return;
    
    const likeIndex = userLikes.togetherPosts.indexOf(currentTogetherPostId);
    
    if (likeIndex > -1) {
        // 이미 좋아요한 경우 - 취소
        userLikes.togetherPosts.splice(likeIndex, 1);
        post.likes = Math.max(0, post.likes - 1);
    } else {
        // 좋아요 추가
        userLikes.togetherPosts.push(currentTogetherPostId);
        post.likes = (post.likes || 0) + 1;
    }
    
    document.getElementById('detailTogetherLikes').textContent = post.likes;
    
    const likeButton = document.querySelector('.together-like-button');
    if (likeButton) {
        const icon = likeButton.querySelector('i');
        if (likeIndex > -1) {
            // 좋아요 취소됨
            likeButton.classList.remove('liked');
            if (icon) {
                icon.className = 'far fa-heart';
                icon.style.color = '';
            }
        } else {
            // 좋아요 추가됨
            likeButton.classList.add('liked');
            if (icon) {
                icon.className = 'fas fa-heart';
                icon.style.color = 'var(--primary-color)';
            }
        }
    }
}

// 같이가요 상세에서 뒤로 가기
function navigateBackFromTogetherDetail() {
    document.getElementById('togetherDetailPage').classList.remove('active');
    document.querySelector('.bottom-nav').style.display = 'flex';
    
    if (fromPage === 'together') {
        document.getElementById('togetherPage').classList.add('active');
    } else if (fromPage === 'detail') {
        document.getElementById('detailPage').classList.add('active');
    } else if (fromPage === 'myLikes') {
        document.getElementById('myLikesPage').classList.add('active');
        // 현재 탭 유지하며 목록 새로고침
        renderLikedTogether();
    } else {
        // 기본값: 같이가요 메인으로
        document.getElementById('togetherPage').classList.add('active');
    }
    
    // fromPage 초기화
    fromPage = null;
    
    window.scrollTo(0, 0);
}

// 같이가요 게시글 공유하기
function shareTogetherPost() {
    if (!currentTogetherPostId) return;
    
    const post = togetherPosts.find(p => p.id === currentTogetherPostId);
    if (post) {
        alert(`"${post.title}" 게시글을 공유합니다! (미구현)`);
    }
}

// 같이가요 신청하기
function applyTogetherPost() {
    // 로그인 체크
    if (!checkLoginRequired()) return;
    
    if (!currentTogetherPostId) return;
    
    const post = togetherPosts.find(p => p.id === currentTogetherPostId);
    if (!post) return;
    
    // 신청 모달 열기
    const modal = document.getElementById('togetherApplyModal');
    document.getElementById('applyQuestionLabel').textContent = post.question || '작성자 질문이 없습니다.';
    
    // 폼 초기화
    document.getElementById('applyAnswer').value = '';
    document.getElementById('applyGender').value = '';
    document.getElementById('applyAge').value = '';
    document.getElementById('applyJob').value = '';
    document.getElementById('applyIntro').value = '';
    
    modal.classList.add('active');
}

// 같이가요 신청 모달 닫기
function closeTogetherApplyModal() {
    const modal = document.getElementById('togetherApplyModal');
    modal.classList.remove('active');
}

// 같이가요 신청 완료
function submitTogetherApply() {
    const answer = document.getElementById('applyAnswer').value.trim();
    const gender = document.getElementById('applyGender').value;
    const age = document.getElementById('applyAge').value;
    const job = document.getElementById('applyJob').value.trim();
    const intro = document.getElementById('applyIntro').value.trim();
    
    // 유효성 검사
    if (!answer && togetherPosts.find(p => p.id === currentTogetherPostId).question) {
        alert('질문에 대한 답변을 작성해주세요.');
        return;
    }
    
    if (!gender) {
        alert('성별을 선택해주세요.');
        return;
    }
    
    if (!age) {
        alert('연령대를 선택해주세요.');
        return;
    }
    
    if (!job) {
        alert('직업을 입력해주세요.');
        return;
    }
    
    if (intro.length < 20) {
        alert('자기소개는 최소 20자 이상 작성해주세요.');
        return;
    }
    
    // 신청 데이터 저장
    const application = {
        id: Date.now(),
        nickname: currentUserNickname,
        answer: answer,
        applicantInfo: {
            gender: gender,
            age: age,
            job: job,
            intro: intro
        }
    };
    
    // 참여 신청자 목록에 추가
    if (!togetherApplications[currentTogetherPostId]) {
        togetherApplications[currentTogetherPostId] = {
            confirmed: [],
            pending: []
        };
    }
    
    togetherApplications[currentTogetherPostId].pending.push(application);
    
    // 내 신청 내역에 추가
    const today = new Date();
    const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    myApplications.push({
        postId: currentTogetherPostId,
        applicationDate: dateString,
        status: "pending",
        answer: answer,
        applicantInfo: {
            gender: gender,
            age: age,
            job: job,
            intro: intro
        }
    });
    
    // 🔥 localStorage에 신청 내역 저장
    if (currentUser) {
        const phoneKey = currentUser.phoneNumber.replace(/-/g, '');
        localStorage.setItem('myApplications_' + phoneKey, JSON.stringify(myApplications));
        console.log('✅ 신청 내역 저장됨:', myApplications.length, '건');
    }
    
    alert('신청이 완료되었습니다!\n\n작성자가 확인 후 수락하면 확정됩니다.');
    closeTogetherApplyModal();
}

// 네이버 지도 열기
function openNaverMap() {
    if (!currentTogetherPostId) return;
    
    const post = togetherPosts.find(p => p.id === currentTogetherPostId);
    if (post) {
        alert(`네이버 지도에서 "${post.storeName}"을(를) 검색합니다 (미구현)`);
    }
}

// 참여자 목록 렌더링
function renderParticipantsList(postId) {
    const applications = togetherApplications[postId];
    if (!applications) return;
    
    // 참여 확정자 목록
    const confirmedContainer = document.getElementById('confirmedParticipants');
    confirmedContainer.innerHTML = '';
    
    if (applications.confirmed.length === 0) {
        confirmedContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">아직 확정된 참여자가 없습니다.</p>';
    } else {
        applications.confirmed.forEach(app => {
            const item = document.createElement('div');
            item.className = 'participant-item';
            item.onclick = () => showParticipantInfo(app, 'confirmed');
            item.innerHTML = `
                <span class="participant-name">${app.nickname}</span>
                <i class="fas fa-chevron-right participant-arrow"></i>
            `;
            confirmedContainer.appendChild(item);
        });
    }
    
    // 참여 신청자 목록
    const pendingContainer = document.getElementById('pendingParticipants');
    pendingContainer.innerHTML = '';
    
    if (applications.pending.length === 0) {
        pendingContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">아직 신청자가 없습니다.</p>';
    } else {
        applications.pending.forEach(app => {
            const item = document.createElement('div');
            item.className = 'participant-item';
            item.onclick = () => showParticipantInfo(app, 'pending');
            item.innerHTML = `
                <span class="participant-name">${app.nickname}</span>
                <i class="fas fa-chevron-right participant-arrow"></i>
            `;
            pendingContainer.appendChild(item);
        });
    }
}

// 참여자 정보 팝업 표시
let currentParticipant = null;
let currentParticipantStatus = null;

function showParticipantInfo(participant, status) {
    currentParticipant = participant;
    currentParticipantStatus = status;
    
    const post = togetherPosts.find(p => p.id === currentTogetherPostId);
    
    document.getElementById('participantNickname').textContent = participant.nickname;
    document.getElementById('participantQuestion').textContent = post.question || '질문 없음';
    document.getElementById('participantAnswer').textContent = participant.answer || '답변 없음';
    document.getElementById('participantGender').textContent = participant.applicantInfo.gender;
    document.getElementById('participantAge').textContent = participant.applicantInfo.age;
    document.getElementById('participantJob').textContent = participant.applicantInfo.job;
    document.getElementById('participantIntro').textContent = participant.applicantInfo.intro;
    
    // 수락/거절 버튼은 pending 상태일 때만 표시
    const actions = document.getElementById('participantActions');
    if (status === 'pending') {
        actions.style.display = 'flex';
    } else {
        actions.style.display = 'none';
    }
    
    const modal = document.getElementById('participantInfoModal');
    modal.classList.add('active');
}

// 참여자 정보 모달 닫기
function closeParticipantInfoModal() {
    const modal = document.getElementById('participantInfoModal');
    modal.classList.remove('active');
    currentParticipant = null;
    currentParticipantStatus = null;
}

// 참여자 수락
function acceptParticipant() {
    if (!currentParticipant || !currentTogetherPostId) return;
    
    const applications = togetherApplications[currentTogetherPostId];
    
    // pending에서 제거
    const index = applications.pending.findIndex(p => p.id === currentParticipant.id);
    if (index !== -1) {
        applications.pending.splice(index, 1);
    }
    
    // confirmed에 추가
    applications.confirmed.push(currentParticipant);
    
    // 신청자가 현재 사용자인 경우 내 신청 내역 업데이트
    if (currentParticipant.nickname === currentUserNickname) {
        const myApp = myApplications.find(app => app.postId === currentTogetherPostId);
        if (myApp) {
            myApp.status = 'accepted';
        }
        
        // 버튼 상태 업데이트
        updateApplyButtonState(currentTogetherPostId);
    }
    
    // 목록 업데이트
    renderParticipantsList(currentTogetherPostId);
    
    alert('참여를 수락했습니다!');
    closeParticipantInfoModal();
}

// 참여자 거절
function rejectParticipant() {
    if (!currentParticipant || !currentTogetherPostId) return;
    
    if (!confirm('정말 거절하시겠습니까?')) {
        return;
    }
    
    const applications = togetherApplications[currentTogetherPostId];
    
    // pending에서 제거
    const index = applications.pending.findIndex(p => p.id === currentParticipant.id);
    if (index !== -1) {
        applications.pending.splice(index, 1);
    }
    
    // 신청자가 현재 사용자인 경우 내 신청 내역 업데이트
    if (currentParticipant.nickname === currentUserNickname) {
        const myApp = myApplications.find(app => app.postId === currentTogetherPostId);
        if (myApp) {
            myApp.status = 'rejected';
        }
        
        // 버튼 상태 업데이트
        updateApplyButtonState(currentTogetherPostId);
    }
    
    // 목록 업데이트
    renderParticipantsList(currentTogetherPostId);
    
    alert('참여를 거절했습니다.');
    closeParticipantInfoModal();
}

// '내가 쓴 같이가요'로 이동
function navigateToMyTogether() {
    document.getElementById('myPage').classList.remove('active');
    document.getElementById('myTogetherPage').classList.add('active');
    
    // 🔥 내가 쓴 게시글 렌더링 (전화번호로 필터링)
    const myPosts = currentUser 
        ? togetherPosts.filter(p => p.phoneNumber === currentUser.phoneNumber)
        : [];
    
    const container = document.getElementById('myTogetherCards');
    container.innerHTML = '';
    
    console.log('✅ 내가 쓴 같이가요:', myPosts.length, '개');
    
    if (myPosts.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">작성한 같이가요 게시글이 없습니다.</p>';
    } else {
        myPosts.forEach(post => {
            const card = createTogetherCard(post);
            container.appendChild(card);
        });
    }
    
    window.scrollTo(0, 0);
}

// '신청한 같이가요'로 이동
function navigateToAppliedTogether() {
    document.getElementById('myPage').classList.remove('active');
    document.getElementById('appliedTogetherPage').classList.add('active');
    
    // 신청한 게시글 렌더링
    const container = document.getElementById('appliedTogetherCards');
    container.innerHTML = '';
    
    if (myApplications.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">신청한 같이가요 게시글이 없습니다.</p>';
    } else {
        myApplications.forEach(app => {
            const post = togetherPosts.find(p => p.id === app.postId);
            if (post) {
                const card = createAppliedTogetherCard(post, app);
                container.appendChild(card);
            }
        });
    }
    
    window.scrollTo(0, 0);
}

// 신청한 같이가요 카드 생성
function createAppliedTogetherCard(post, application) {
    const card = document.createElement('div');
    card.className = 'together-card';
    card.onclick = () => showTogetherDetail(post.id);
    card.style.cursor = 'pointer';
    
    // 상태 텍스트 및 클래스
    let statusText = '';
    let statusClass = '';
    
    switch(application.status) {
        case 'accepted':
            statusText = '수락됨';
            statusClass = 'status-accepted';
            break;
        case 'rejected':
            statusText = '거절됨';
            statusClass = 'status-rejected';
            break;
        case 'pending':
            statusText = '대기 중';
            statusClass = 'status-pending';
            break;
    }
    
    card.innerHTML = `
        <div class="together-header">
            <span class="together-nickname">${post.nickname}</span>
            <span class="together-time">${post.time}</span>
        </div>
        <h3 class="together-title">${post.title}</h3>
        <p class="together-content">${post.content}</p>
        <div class="together-details">
            <div class="together-detail">
                <i class="far fa-calendar"></i>
                <span>${post.date}</span>
            </div>
            <div class="together-detail">
                <i class="far fa-clock"></i>
                <span>${post.time}</span>
            </div>
            <div class="together-detail">
                <i class="fas fa-users"></i>
                <span>${post.people}</span>
            </div>
            <div class="together-detail">
                <i class="fas fa-map-marker-alt"></i>
                <span>${post.storeName} · ${post.storeAddress}</span>
            </div>
        </div>
        <div class="application-status-row">
            <span class="application-date">신청일: ${application.applicationDate}</span>
            <span class="status-badge ${statusClass}">${statusText}</span>
        </div>
    `;
    return card;
}

// '내 좋아요'로 이동
function navigateToMyLikes() {
    document.getElementById('myPage').classList.remove('active');
    document.getElementById('myLikesPage').classList.add('active');
    
    // 동네선물 탭 표시
    switchLikesTab('gifts');
    
    window.scrollTo(0, 0);
}

// 좋아요 탭 전환
function switchLikesTab(tab) {
    // 탭 버튼 상태 변경
    const tabs = document.querySelectorAll('.likes-tab');
    tabs.forEach(t => t.classList.remove('active'));
    
    // 섹션 표시/숨김
    const sections = document.querySelectorAll('.likes-section');
    sections.forEach(s => s.classList.remove('active'));
    
    if (tab === 'gifts') {
        tabs[0].classList.add('active');
        document.getElementById('likedGiftsSection').classList.add('active');
        renderLikedGifts();
    } else if (tab === 'together') {
        tabs[1].classList.add('active');
        document.getElementById('likedTogetherSection').classList.add('active');
        renderLikedTogether();
    }
}

// 좋아요한 동네선물 렌더링
function renderLikedGifts() {
    const container = document.getElementById('likedGiftsCards');
    container.innerHTML = '';
    
    const likedGifts = sampleGifts.filter(gift => userLikes.gifts.includes(gift.id));
    
    if (likedGifts.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">좋아요한 동네선물이 없습니다.</p>';
        return;
    }
    
    likedGifts.forEach(gift => {
        const card = createGiftCard(gift);
        container.appendChild(card);
    });
}

// 좋아요한 같이가요 렌더링
function renderLikedTogether() {
    const container = document.getElementById('likedTogetherCards');
    container.innerHTML = '';
    
    const likedPosts = togetherPosts.filter(post => userLikes.togetherPosts.includes(post.id));
    
    if (likedPosts.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">좋아요한 같이가요가 없습니다.</p>';
        return;
    }
    
    likedPosts.forEach(post => {
        const card = createTogetherCard(post);
        container.appendChild(card);
    });
}

function shareGift(id) {
    alert('공유하기 기능 (미구현)');
}

function giftVoucher(code) {
    alert(`방문권 ${code}를 친구에게 선물합니다 (미구현)`);
}

function createGroupBuy() {
    // 로그인 체크
    if (!checkLoginRequired()) return;
    
    const gift = sampleGifts.find(g => g.id === currentGiftId);
    if (!gift) return;
    
    // 공동구매가 없는 상품인지 확인
    if (gift.groupBuys === null) {
        alert('이 상품은 공동구매를 지원하지 않습니다.');
        return;
    }
    
    const modal = document.getElementById('groupBuyModal');
    
    // 공동구매 정보 설정
    const groupBuyDiscount = gift.groupBuys && gift.groupBuys.length > 0 
        ? gift.groupBuys[0].discountRate 
        : gift.discountRate + 5; // 기본 할인율 + 5%
    
    document.getElementById('groupBuyDiscountRate').textContent = `${groupBuyDiscount}% 환급`;
    
    modal.classList.add('active');
}

function closeGroupBuyModal() {
    const modal = document.getElementById('groupBuyModal');
    modal.classList.remove('active');
}

function confirmGroupBuy() {
    const gift = sampleGifts.find(g => g.id === currentGiftId);
    if (!gift) return;
    
    // 공동구매 목록 초기화
    if (!gift.groupBuys) {
        gift.groupBuys = [];
    }
    
    // 1명만 있는(미완료) 공동구매 찾기
    const availableGroupBuy = gift.groupBuys.find(gb => 
        !gb.isComplete && gb.users.length === 1
    );
    
    if (availableGroupBuy) {
        // 기존 공동구매에 참여
        if (!confirm('진행 중인 공동구매에 참여하시겠습니까?\n\n바로 공동구매가 성사되어 결제가 진행됩니다.')) {
            return;
        }
        
        // 🔥 API로 참여 요청
        // Mock user ID: 로그인 없이 테스트하기 위해 랜덤 userId 생성 (2-6)
        const userId = Math.floor(Math.random() * 5) + 2;
        fetch(`/api/group-buys/${availableGroupBuy.id}/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId: userId })
        })
        .then(response => response.json())
        .then(async data => {
            if (data.success) {
                console.log('✅ 공동구매 참여 성공');
                
                // 🔥 API에서 최신 데이터 다시 가져오기
                const detailResponse = await fetch(`/api/gifts/${gift.id}`);
                const detailData = await detailResponse.json();
                
                if (detailData.success) {
                    const apiGift = detailData.data;
                    // 공동구매 데이터 업데이트
                    gift.groupBuys = apiGift.groupBuys.map(gb => ({
                        id: gb.id,
                        createdAt: gb.created_at,
                        discountRate: gb.discount_rate,
                        users: [
                            { initial: gb.creator_nickname[0], color: "#4A90E2" }
                        ],
                        isComplete: gb.is_complete === 1,
                        endTime: gb.expires_at ? new Date(gb.expires_at) : null
                    }));
                    // Add partner user if exists
                    apiGift.groupBuys.forEach((gb, index) => {
                        if (gb.partner_nickname) {
                            gift.groupBuys[index].users.push({
                                initial: gb.partner_nickname[0],
                                color: "#5B7FE8"
                            });
                        }
                    });
                    
                    // sampleGifts 배열 업데이트
                    const giftIndex = sampleGifts.findIndex(g => g.id === gift.id);
                    if (giftIndex !== -1) {
                        sampleGifts[giftIndex].groupBuys = gift.groupBuys;
                    }
                    
                    // localStorage에 저장
                    saveSampleGifts();
                    
                    console.log('✅ 공동구매 최신 데이터 반영 완료');
                }
                
                // 구매 내역에 추가 (공동구매)
                const completedGroupBuy = gift.groupBuys.find(gb => gb.id === availableGroupBuy.id);
                if (completedGroupBuy) {
                    addToPurchaseHistory(gift, 1, true, completedGroupBuy.discountRate);
                }
                
                // 화면 업데이트
                renderGroupBuyCards(gift.groupBuys);
                
                // 모달 먼저 닫기
                closeGroupBuyModal();
                
                // 공동구매 성사 팝업 표시 (약간의 딜레이 후)
                setTimeout(() => {
                    alert('🎉 공동구매 성사!\n\n2명이 모두 모집되었습니다.\n구매 내역에서 확인하실 수 있습니다.');
                }, 300);
            } else {
                console.error('❌ 공동구매 참여 실패:', data.error);
                alert('공동구매 참여에 실패했습니다. 다시 시도해주세요.');
            }
        })
        .catch(error => {
            console.error('❌ API 호출 실패:', error);
            alert('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
        });
        
    } else {
        // 새로운 공동구매 생성
        if (!confirm('공동구매를 신청하시겠습니까?\n\n24시간 이내 함께 구매할 사람이 모집되면 자동으로 결제가 진행됩니다.')) {
            return;
        }
        
        const discountRate = gift.groupBuys && gift.groupBuys.length > 0 
            ? gift.groupBuys[0].discountRate 
            : gift.discountRate + 10;
        
        // 🔥 API로 공동구매 생성
        // Mock user ID: 로그인 없이 테스트하기 위해 랜덤 userId 생성 (2-6)
        const userId = Math.floor(Math.random() * 5) + 2;
        fetch('/api/group-buys', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                giftId: gift.id,
                userId: userId,
                discountRate: discountRate
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('✅ 공동구매 생성 성공:', data.data.id);
                
                const newGroupBuy = {
                    id: data.data.id,
                    createdAt: new Date().toLocaleString('ko-KR', { 
                        year: 'numeric', 
                        month: '2-digit', 
                        day: '2-digit', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    }).replace(/\. /g, '-').replace('.', ''),
                    discountRate: discountRate,
                    users: [
                        { initial: "나", color: "#4A90E2" }
                    ],
                    isComplete: false,
                    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24시간 후
                };
                
                // 공동구매 목록에 추가
                gift.groupBuys.unshift(newGroupBuy);
                
                // localStorage에 저장
                saveSampleGifts();
                
                // 화면 업데이트
                renderGroupBuyCards(gift.groupBuys);
                
                alert('공동구매 신청이 완료되었습니다!\n\n24시간 이내 함께 구매할 사람이 모집되면 자동으로 결제가 진행됩니다.');
                closeGroupBuyModal();
            } else {
                console.error('❌ 공동구매 생성 실패:', data.error);
                alert('공동구매 신청에 실패했습니다. 다시 시도해주세요.');
            }
        })
        .catch(error => {
            console.error('❌ API 호출 실패:', error);
            alert('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
        });
        
        // 카운트다운 시작
        startCountdowns();
        
        alert('공동구매 신청이 완료되었습니다!\n\n24시간 이내 함께 구매할 사람이 모집되면 알림을 보내드립니다.');
        closeGroupBuyModal();
    }
}

// 구매 내역에 추가
function addToPurchaseHistory(gift, quantity, isGroupBuy = false, groupBuyRate = null) {
    // 바우처 코드 생성 (알파벳 3자리 + 숫자 2자리)
    const generateVoucherCode = () => {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let code = '';
        
        // 알파벳 3자리 생성
        for (let i = 0; i < 3; i++) {
            code += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        
        // 숫자 2자리 생성 (10-99)
        code += Math.floor(Math.random() * 90) + 10;
        
        return code;
    };
    
    // 유효기간 계산 (3개월 후)
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 3);
    const expiryString = `${expiryDate.getFullYear()}-${String(expiryDate.getMonth() + 1).padStart(2, '0')}-${String(expiryDate.getDate()).padStart(2, '0')}`;
    
    // 환급률 결정
    const refundRate = isGroupBuy ? groupBuyRate : gift.discountRate;
    
    // 수량만큼 구매 내역 추가
    for (let i = 0; i < quantity; i++) {
        const purchase = {
            id: Date.now() + i,
            giftId: gift.id, // 🔥 원본 상품 ID 추가!
            storeName: gift.storeName,
            storeIntro: gift.storeIntro,
            productName: gift.productName,
            originalPrice: gift.originalPrice,
            discountRate: refundRate,
            discountedPrice: isGroupBuy 
                ? Math.floor(gift.originalPrice * (1 - refundRate / 100))
                : gift.discountedPrice,
            location: gift.location,
            image: gift.images[0],
            voucherCode: generateVoucherCode(),
            expiryDate: expiryString,
            isGroupBuy: isGroupBuy,
            reviewWritten: false, // 🔥 후기 작성 여부
            reviewText: '' // 🔥 작성한 후기 내용
        };
        
        // 배열 맨 앞에 추가 (최신 순)
        purchaseHistory.unshift(purchase);
    }
    
    // 🔥 localStorage에 구매 내역 저장 (사용자별)
    if (currentUser) {
        const phoneKey = currentUser.phoneNumber.replace(/-/g, '');
        localStorage.setItem('purchaseHistory_' + phoneKey, JSON.stringify(purchaseHistory));
        console.log('✅ 구매 내역 저장됨:', purchaseHistory.length, '건');
    }
    
    // 구매 내역 화면 업데이트
    renderPurchaseHistory();
}

// 같이가요 작성 모달 열기
function createTogetherPost() {
    // 로그인 체크
    if (!checkLoginRequired()) return;
    
    const modal = document.getElementById('togetherWriteModal');
    modal.classList.add('active');
    
    // 폼 초기화
    document.getElementById('togetherTitle').value = '';
    document.getElementById('togetherContent').value = '';
    document.getElementById('togetherStore').value = '';
    document.getElementById('togetherDate').value = '';
    document.getElementById('togetherTime').value = '';
    document.getElementById('togetherPeople').value = '2명';
    document.getElementById('togetherQuestion').value = '';
    document.getElementById('authorGender').value = '';
    document.getElementById('authorAge').value = '';
    document.getElementById('authorJob').value = '';
    document.getElementById('authorIntro').value = '';
    
    // 현재 상세 페이지에서 작성하는 경우 가게명 자동 입력
    if (currentGiftId) {
        const gift = sampleGifts.find(g => g.id === currentGiftId);
        if (gift) {
            document.getElementById('togetherStore').value = gift.storeName;
        }
    }
}

// 같이가요 작성 모달 닫기
function closeTogetherWriteModal() {
    const modal = document.getElementById('togetherWriteModal');
    modal.classList.remove('active');
}

// 같이가요 포스트 등록
function submitTogetherPost() {
    const title = document.getElementById('togetherTitle').value.trim();
    const content = document.getElementById('togetherContent').value.trim();
    const storeName = document.getElementById('togetherStore').value.trim();
    const date = document.getElementById('togetherDate').value.trim();
    const time = document.getElementById('togetherTime').value.trim();
    const people = document.getElementById('togetherPeople').value;
    const question = document.getElementById('togetherQuestion').value.trim();
    const gender = document.getElementById('authorGender').value;
    const age = document.getElementById('authorAge').value;
    const job = document.getElementById('authorJob').value.trim();
    const intro = document.getElementById('authorIntro').value.trim();
    
    // 유효성 검사
    if (!title) {
        alert('제목을 입력해주세요.');
        return;
    }
    
    if (!content) {
        alert('내용을 입력해주세요.');
        return;
    }
    
    if (!storeName) {
        alert('장소(가게명)를 입력해주세요.');
        return;
    }
    
    if (!date) {
        alert('방문 날짜를 입력해주세요.');
        return;
    }
    
    if (!time) {
        alert('방문 시간을 입력해주세요.');
        return;
    }
    
    if (!gender) {
        alert('성별을 선택해주세요.');
        return;
    }
    
    if (!age) {
        alert('연령대를 선택해주세요.');
        return;
    }
    
    if (!job) {
        alert('직업을 입력해주세요.');
        return;
    }
    
    if (intro.length < 20) {
        alert('자기소개는 최소 20자 이상 작성해주세요.');
        return;
    }
    
    // 현재 선물과 연관된 가게 찾기
    const relatedGift = sampleGifts.find(g => g.storeName === storeName);
    const storeAddress = relatedGift ? relatedGift.location : '주소 정보 없음';
    
    // 새 포스트 생성
    const newPost = {
        id: Date.now(),
        nickname: currentUser ? currentUser.nickname : '익명',
        phoneNumber: currentUser ? currentUser.phoneNumber : '', // 🔥 작성자 전화번호 저장
        time: "방금 전",
        title: title,
        content: content,
        date: date,
        time: time,
        people: people,
        storeName: storeName,
        storeAddress: storeAddress,
        question: question,
        authorInfo: {
            gender: gender,
            age: age,
            job: job,
            intro: intro
        },
        likes: 0
    };
    
    // 🔥 API로 전송
    const giftId = relatedGift ? relatedGift.id : 1; // Default to first gift if not found
    const userId = 1; // Mock user ID
    
    fetch('/api/together-posts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            giftId: giftId,
            userId: userId,
            title: title,
            content: content,
            visitDate: date,
            visitTime: time,
            peopleCount: people,
            question: question,
            authorInfo: {
                gender: gender,
                age: age,
                job: job,
                intro: intro
            }
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('✅ 같이가요 게시글이 서버에 저장되었습니다:', data.data.id);
            
            // 로컬 데이터에도 추가 (ID는 서버에서 받은 것으로)
            newPost.id = data.data.id;
            togetherPosts.unshift(newPost);
            
            // 참여자 목록 초기화
            togetherApplications[newPost.id] = {
                confirmed: [],
                pending: []
            };
            
            // 현재 보고 있는 상품의 같이가요에도 추가 (연관 가게인 경우)
            if (currentGiftId && relatedGift && relatedGift.id === currentGiftId) {
                if (!relatedGift.togetherPosts) {
                    relatedGift.togetherPosts = [];
                }
                relatedGift.togetherPosts.unshift(newPost);
                
                // 상세 페이지의 같이가요 카드 업데이트
                renderTogetherCardsInDetail(relatedGift.togetherPosts);
            }
            
            // 같이가요 메인 화면 업데이트
            renderTogetherCards();
            
            // localStorage에 전체 같이가요 목록 저장
            localStorage.setItem('togetherPosts', JSON.stringify(togetherPosts));
            console.log('✅ 같이가요 목록 저장됨:', togetherPosts.length, '개');
            
            alert('같이가요 게시글이 등록되었습니다!');
            closeTogetherWriteModal();
        } else {
            console.error('❌ 게시글 저장 실패:', data.error);
            alert('게시글 등록에 실패했습니다. 다시 시도해주세요.');
        }
    })
    .catch(error => {
        console.error('❌ API 호출 실패:', error);
        alert('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
    });
}

function writeReview(code) {
    currentVoucherCode = code;
    const modal = document.getElementById('reviewModal');
    modal.classList.add('active');
    
    // 🔥 해당 구매 내역 찾기
    const purchase = purchaseHistory.find(p => p.voucherCode === code);
    
    const reviewTextArea = document.getElementById('reviewText');
    const submitBtn = document.querySelector('.submit-review-button');
    const receiptBtn = document.querySelector('.receipt-submit-button');
    
    // 🔥 이미 후기를 작성한 경우
    if (purchase && purchase.reviewWritten) {
        // 작성한 후기 표시 (읽기 전용)
        reviewTextArea.value = purchase.reviewText;
        reviewTextArea.disabled = true;
        reviewTextArea.style.backgroundColor = '#f5f5f5';
        
        // 후기 등록 버튼 비활성화
        submitBtn.textContent = '등록 완료';
        submitBtn.disabled = true;
        submitBtn.classList.add('completed');
        
        // 영수증 제출 버튼 활성화
        receiptBtn.disabled = false;
        receiptBtn.style.opacity = '1';
        receiptBtn.style.cursor = 'pointer';
    } else {
        // 아직 후기를 작성하지 않은 경우 - 초기화
        reviewTextArea.value = '';
        reviewTextArea.disabled = false;
        reviewTextArea.style.backgroundColor = '';
        
        submitBtn.textContent = '후기 등록하기';
        submitBtn.disabled = false;
        submitBtn.classList.remove('completed');
        
        // 영수증 제출 버튼 비활성화 (후기 등록 전)
        receiptBtn.disabled = true;
        receiptBtn.style.opacity = '0.5';
        receiptBtn.style.cursor = 'not-allowed';
    }
}

function closeReviewModal() {
    const modal = document.getElementById('reviewModal');
    modal.classList.remove('active');
    currentVoucherCode = null;
}

function submitReview() {
    const reviewText = document.getElementById('reviewText').value.trim();
    const submitBtn = document.querySelector('.submit-review-button');
    
    // 🔍 디버깅: 함수 실행 확인
    console.log('🚀 submitReview() 실행됨!', reviewText);
    
    if (!reviewText) {
        alert('후기를 입력해주세요.');
        return;
    }
    
    if (reviewText.length < 10) {
        alert('후기는 최소 10자 이상 작성해주세요.');
        return;
    }
    
    // 방문권 코드로 상품 ID 찾기
    const purchase = purchaseHistory.find(p => p.voucherCode === currentVoucherCode);
    if (purchase) {
        // 🔥 원본 상품 찾기 (purchase.giftId 사용!)
        const gift = sampleGifts.find(g => g.id === purchase.giftId);
        
        if (!gift) {
            console.error('❌ 상품을 찾을 수 없음:', purchase.giftId);
            alert('상품 정보를 찾을 수 없습니다.');
            return;
        }
        
        // 새 후기 객체 생성
        const newReview = {
            giftId: purchase.giftId, // 🔥 올바른 giftId 사용!
            nickname: currentUser ? currentUser.nickname : "여행좋아",
            date: new Date().toISOString().split('T')[0],
            purchases: 1,
            comment: reviewText,
            empathy: 0,
            isNew: true
        };
        
        // 후기 목록에 추가 (최신이 앞에)
        userReviews.unshift(newReview);
        
        // localStorage에 저장
        const phoneKey = currentUser ? currentUser.phoneNumber.replace(/-/g, '') : 'default';
        const savedReviews = JSON.parse(localStorage.getItem('userReviews_' + phoneKey) || '[]');
        savedReviews.unshift(newReview);
        localStorage.setItem('userReviews_' + phoneKey, JSON.stringify(savedReviews));
        console.log('✅ localStorage에 저장됨:', savedReviews.length, '개 후기');
        
        // 상세 페이지가 열려있다면 즉시 업데이트
        if (document.getElementById('detailPage').classList.contains('active') && currentGiftId === purchase.id) {
            renderCommentsInDetail(gift.comments);
            console.log('✅ 상세 페이지 후기 즉시 업데이트');
        }
        
        // 🔥 구매 내역에 후기 작성 여부 표시
        purchase.reviewWritten = true;
        purchase.reviewText = reviewText;
        
        // 🔥 localStorage에 구매 내역 업데이트
        if (currentUser) {
            const phoneKey = currentUser.phoneNumber.replace(/-/g, '');
            localStorage.setItem('purchaseHistory_' + phoneKey, JSON.stringify(purchaseHistory));
            console.log('✅ 구매 내역 업데이트됨 (후기 작성 완료)');
        }
    }
    
    // 버튼 상태 변경
    submitBtn.textContent = '등록 완료';
    submitBtn.disabled = true;
    submitBtn.classList.add('completed');
    
    // textarea 읽기 전용으로 변경
    const reviewTextArea = document.getElementById('reviewText');
    reviewTextArea.disabled = true;
    reviewTextArea.style.backgroundColor = '#f5f5f5';
    
    // 영수증 제출 버튼 활성화
    const receiptBtn = document.querySelector('.receipt-submit-button');
    receiptBtn.disabled = false;
    receiptBtn.style.opacity = '1';
    receiptBtn.style.cursor = 'pointer';
    
    // 알림 표시 (모달은 닫지 않음!)
    alert('후기가 등록되었습니다! 감사합니다.\n\n이제 바로 아래 "영수증 사진 제출하고 환급 신청" 버튼을 눌러주세요!');
}

function submitReceipt() {
    const receiptBtn = document.querySelector('.receipt-submit-button');
    
    // 비활성화 상태면 작동 안 함
    if (receiptBtn.disabled) {
        return;
    }
    
    // 추후 카카오톡 채널 연결
    const kakaoChannel = 'https://pf.kakao.com/_your_channel'; // 실제 카카오톡 채널 URL로 변경 필요
    
    if (confirm('영수증 제출을 위해 카카오톡 채널로 이동하시겠습니까?')) {
        // 임시로 알림 표시 (실제로는 카카오톡 채널로 이동)
        alert('카카오톡 채널로 이동합니다.\n\n관리자에게 영수증 사진과 방문권 코드를 전송해주세요.');
        // window.open(kakaoChannel, '_blank'); // 실제 연결 시 주석 해제
        closeReviewModal();
    }
}

// ==================== 회원가입/로그인 시스템 ====================

// 임시 인증번호 저장
let pendingVerification = null; // { phoneNumber, code, nickname }

// 로그인 상태 복원
function restoreLoginState() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        isLoggedIn = true;
        
        // 사용자의 좋아요 데이터 로드
        const phoneKey = currentUser.phoneNumber.replace(/-/g, '');
        
        // 🔥 localStorage에서 먼저 로드
        const savedLikes = JSON.parse(localStorage.getItem('userLikes_' + phoneKey) || 'null');
        if (savedLikes) {
            userLikesDatabase[phoneKey] = savedLikes;
            userLikes.gifts = [...savedLikes.gifts];
            userLikes.togetherPosts = [...savedLikes.togetherPosts];
            console.log('✅ 좋아요 데이터 복원됨:', savedLikes.gifts.length, '개 동네선물,', savedLikes.togetherPosts.length, '개 같이가요');
        } else if (userLikesDatabase[phoneKey]) {
            // 백업: 메모리에만 있는 경우
            userLikes.gifts = [...userLikesDatabase[phoneKey].gifts];
            userLikes.togetherPosts = [...userLikesDatabase[phoneKey].togetherPosts];
        }
        
        // 사용자의 후기 데이터 로드
        const savedReviews = JSON.parse(localStorage.getItem('userReviews_' + phoneKey) || '[]');
        userReviews = savedReviews;
        
        // 사용자 후기를 sampleGifts에 동기화
        userReviews.forEach(review => {
            const gift = sampleGifts.find(g => g.id === review.giftId);
            if (gift) {
                // 이미 추가된 후기가 아닌 경우에만 추가
                const exists = gift.comments.some(c => 
                    c.nickname === review.nickname && 
                    c.comment === review.comment && 
                    c.date === review.date
                );
                if (!exists) {
                    gift.comments.unshift(review);
                }
            }
        });
        
        // 🔥 사용자의 구매 내역 복원
        const savedPurchaseHistory = JSON.parse(localStorage.getItem('purchaseHistory_' + phoneKey) || '[]');
        purchaseHistory = savedPurchaseHistory;
        console.log('✅ 구매 내역 복원됨:', purchaseHistory.length, '건');
        
        // 구매 내역 화면 업데이트
        renderPurchaseHistory();
        
        // 🔥 사용자의 신청 내역 복원
        const savedApplications = JSON.parse(localStorage.getItem('myApplications_' + phoneKey) || '[]');
        myApplications = savedApplications;
        console.log('✅ 신청 내역 복원됨:', myApplications.length, '건');
    }
    
    // 🔥 전체 같이가요 목록 복원 (모든 사용자 공통)
    const savedTogetherPosts = JSON.parse(localStorage.getItem('togetherPosts') || 'null');
    if (savedTogetherPosts && savedTogetherPosts.length > 0) {
        togetherPosts = savedTogetherPosts;
        console.log('✅ 같이가요 목록 복원됨:', togetherPosts.length, '개');
        renderTogetherCards();
    }
    
    // 닉네임/전화번호 업데이트 (로그인/로그아웃 모두)
    updateUserNickname();
    
    // 마이페이지 UI 업데이트
    updateMyPageUI();
}

// 사용자 닉네임 및 전화번호 표시 업데이트
function updateUserNickname() {
    const userInfoElem = document.querySelector('.page-header .user-info');
    
    if (isLoggedIn && currentUser) {
        // 마이페이지 닉네임 업데이트
        const nicknameElem = document.querySelector('.page-header .nickname');
        if (nicknameElem) {
            nicknameElem.textContent = currentUser.nickname;
        }
        
        // 마이페이지 전화번호 업데이트
        const phoneElem = document.getElementById('userPhone');
        if (phoneElem) {
            phoneElem.textContent = `(${currentUser.phoneNumber})`;
        }
        
        // user-info 영역 표시
        if (userInfoElem) {
            userInfoElem.style.display = 'block';
        }
        
        // 전역 변수 업데이트 (기존 코드 호환성)
        currentUserNickname = currentUser.nickname;
    } else {
        // 로그아웃 상태 - user-info 영역 숨김
        if (userInfoElem) {
            userInfoElem.style.display = 'none';
        }
    }
}

// 마이페이지 UI 업데이트
function updateMyPageUI() {
    const myPageContent = document.querySelector('#myPage .main-content');
    if (!myPageContent) return;
    
    if (!isLoggedIn) {
        // 미로그인 상태 UI
        myPageContent.innerHTML = `
            <div class="login-required-notice">
                <i class="fas fa-user-circle"></i>
                <h3>로그인이 필요합니다</h3>
                <p>서비스를 이용하려면<br>회원가입 또는 로그인을 해주세요</p>
                <button class="login-button" onclick="showAuthModal()">
                    회원가입 / 로그인
                </button>
            </div>
        `;
    } else {
        // 로그인 상태 UI (기존 메뉴)
        myPageContent.innerHTML = `
            <div class="menu-list">
                <button class="menu-item" onclick="navigateToPurchaseHistory()">
                    <span>구매 내역</span>
                    <i class="fas fa-chevron-right"></i>
                </button>
                <button class="menu-item" onclick="navigateToMyTogether()">
                    <span>내가 쓴 같이가요</span>
                    <i class="fas fa-chevron-right"></i>
                </button>
                <button class="menu-item" onclick="navigateToAppliedTogether()">
                    <span>신청한 같이가요</span>
                    <i class="fas fa-chevron-right"></i>
                </button>
                <button class="menu-item" onclick="navigateToMyLikes()">
                    <span>내 좋아요</span>
                    <i class="fas fa-chevron-right"></i>
                </button>
                <button class="menu-item" onclick="alert('고객센터 (미구현)')">
                    <span>고객센터</span>
                    <i class="fas fa-chevron-right"></i>
                </button>
                <button class="menu-item logout" onclick="logout()">
                    <span>로그아웃</span>
                    <i class="fas fa-sign-out-alt"></i>
                </button>
            </div>
        `;
    }
}

// 로그인 체크 함수
function checkLoginRequired() {
    if (!isLoggedIn) {
        showAuthModal();
        return false;
    }
    return true;
}

// 회원가입/로그인 모달 열기
function showAuthModal() {
    const modal = document.getElementById('authModal');
    modal.classList.add('active');
    
    // 폼 초기화
    document.getElementById('authNickname').value = '';
    document.getElementById('authPhone').value = '';
    document.getElementById('authCode').value = '';
    document.getElementById('verificationSection').style.display = 'none';
    
    // 전화번호 입력 자동 포맷팅
    const phoneInput = document.getElementById('authPhone');
    phoneInput.addEventListener('input', formatPhoneNumber);
}

// 회원가입/로그인 모달 닫기
function closeAuthModal() {
    const modal = document.getElementById('authModal');
    modal.classList.remove('active');
    pendingVerification = null;
}

// 전화번호 자동 포맷팅
function formatPhoneNumber(e) {
    let value = e.target.value.replace(/[^0-9]/g, '');
    
    if (value.length <= 3) {
        e.target.value = value;
    } else if (value.length <= 7) {
        e.target.value = value.slice(0, 3) + '-' + value.slice(3);
    } else {
        e.target.value = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7, 11);
    }
}

// 인증 요청
function requestVerification() {
    const nickname = document.getElementById('authNickname').value.trim();
    const phone = document.getElementById('authPhone').value.trim();
    
    // 유효성 검사
    if (!nickname) {
        alert('닉네임을 입력해주세요.');
        return;
    }
    
    if (nickname.length < 2 || nickname.length > 10) {
        alert('닉네임은 2~10자로 입력해주세요.');
        return;
    }
    
    if (!phone || phone.length < 12) {
        alert('올바른 전화번호를 입력해주세요.');
        return;
    }
    
    // 인증번호 생성 (실제로는 서버에서 SMS 발송)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    pendingVerification = {
        phoneNumber: phone,
        code: verificationCode,
        nickname: nickname
    };
    
    // 인증번호 섹션 표시
    document.getElementById('verificationSection').style.display = 'block';
    
    // 개발용: 콘솔에 인증번호 출력
    console.log('🔐 인증번호:', verificationCode);
    alert(`인증번호가 전송되었습니다.\n\n[개발용] 인증번호: ${verificationCode}`);
}

// 인증 확인
function confirmVerification() {
    const inputCode = document.getElementById('authCode').value.trim();
    
    if (!inputCode) {
        alert('인증번호를 입력해주세요.');
        return;
    }
    
    if (!pendingVerification) {
        alert('먼저 인증하기 버튼을 눌러주세요.');
        return;
    }
    
    // 인증번호 확인
    if (inputCode === pendingVerification.code) {
        // 인증 성공
        processLogin(pendingVerification.phoneNumber, pendingVerification.nickname);
    } else {
        alert('인증번호가 일치하지 않습니다.');
    }
}

// 로그인 처리
function processLogin(phoneNumber, nickname) {
    const phoneKey = phoneNumber.replace(/-/g, '');
    
    // 기존 사용자 확인
    const existingUser = usersDatabase[phoneKey];
    
    let isNewUser = false;
    
    if (existingUser) {
        // 기존 사용자 - 닉네임 변경 확인
        const oldNickname = existingUser.nickname;
        
        if (oldNickname !== nickname) {
            // 닉네임이 변경됨 - 모든 데이터 업데이트
            updateUserDataNickname(oldNickname, nickname);
        }
        
        // 사용자 정보 업데이트
        existingUser.nickname = nickname;
    } else {
        // 신규 사용자
        isNewUser = true;
        usersDatabase[phoneKey] = {
            phoneNumber: phoneNumber,
            nickname: nickname
        };
        
        // 좋아요 데이터 초기화
        userLikesDatabase[phoneKey] = {
            gifts: [],
            togetherPosts: []
        };
    }
    
    // 현재 사용자 설정
    currentUser = {
        phoneNumber: phoneNumber,
        nickname: nickname
    };
    isLoggedIn = true;
    
    // 로컬스토리지에 저장
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // 사용자의 좋아요 데이터 로드
    if (userLikesDatabase[phoneKey]) {
        userLikes.gifts = [...userLikesDatabase[phoneKey].gifts];
        userLikes.togetherPosts = [...userLikesDatabase[phoneKey].togetherPosts];
    }
    
    // 모달 먼저 닫기
    closeAuthModal();
    
    // UI 업데이트
    updateUserNickname();
    updateMyPageUI();
    
    // 화면 새로고침
    renderGiftCards();
    renderTogetherCards();
    
    // 로그인 완료 알림 (모달 닫힌 후)
    setTimeout(() => {
        if (isNewUser) {
            alert(`🎉 회원가입이 완료되었습니다!\n\n${nickname}님, 환영합니다!`);
        } else {
            alert(`${nickname}님, 다시 오신 것을 환영합니다! 😊`);
        }
    }, 100);
}

// 닉네임 변경 시 모든 데이터 동기화
function updateUserDataNickname(oldNickname, newNickname) {
    // 같이가요 작성자 닉네임 업데이트
    togetherPosts.forEach(post => {
        if (post.nickname === oldNickname) {
            post.nickname = newNickname;
        }
    });
    
    // 같이가요 신청자 닉네임 업데이트
    Object.values(togetherApplications).forEach(applications => {
        [...applications.confirmed, ...applications.pending].forEach(applicant => {
            if (applicant.nickname === oldNickname) {
                applicant.nickname = newNickname;
            }
        });
    });
    
    // 구매 내역 (필요시 추가)
    // 후기 작성자 (필요시 추가)
}

// 로그아웃
function logout() {
    if (!confirm('로그아웃 하시겠습니까?')) {
        return;
    }
    
    // 현재 사용자의 좋아요 데이터 저장
    if (currentUser) {
        const phoneKey = currentUser.phoneNumber.replace(/-/g, '');
        userLikesDatabase[phoneKey] = {
            gifts: [...userLikes.gifts],
            togetherPosts: [...userLikes.togetherPosts]
        };
    }
    
    // 로그아웃 처리
    currentUser = null;
    isLoggedIn = false;
    currentUserNickname = '여행좋아'; // 기본값으로 복원
    
    // 좋아요 데이터 초기화
    userLikes.gifts = [];
    userLikes.togetherPosts = [];
    
    // 신청 내역 초기화
    myApplications = [];
    
    // 구매 내역 초기화
    purchaseHistory = [];
    
    // 로컬스토리지에서 제거
    localStorage.removeItem('currentUser');
    
    // UI 업데이트
    updateUserNickname();
    updateMyPageUI();
    
    // 화면 새로고침
    renderGiftCards();
    renderTogetherCards();
    renderPurchaseHistory();
    
    alert('로그아웃되었습니다.');
    
    // 메인 페이지로 이동
    navigateToMainFromMyPage();
}

// 마이페이지에서 메인으로 이동
function navigateToMainFromMyPage() {
    document.getElementById('myPage').classList.remove('active');
    document.getElementById('mainPage').classList.add('active');
    window.scrollTo(0, 0);
}
