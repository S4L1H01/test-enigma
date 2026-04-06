(function() {
    const SB_URL = "https://vovgbyecufjtizvsdtpj.supabase.co";
    const SB_KEY = "sb_publishable_mCC1vz5bXw2qbWoozoIfgQ__5t7AQWe";

    let _idx    = parseInt(localStorage.getItem('_tx_l')) || 0;
    let _off    = parseInt(localStorage.getItem('_tx_t')) || 0;
    let _sts    = JSON.parse(localStorage.getItem('_tx_s'))  || [];
    // Her oda için yanlış cevap sayısı
    let _wrongs = JSON.parse(localStorage.getItem('_tx_w'))  || [];
    // Bu oturumda girilen tüm yanlış cevaplar [{room, answer, ts}]
    let _wrongLog = JSON.parse(localStorage.getItem('_tx_wl')) || [];

    let _ref, _tmr, _st;
    let _currentWrong = 0; // Aktif odadaki hata sayısı (görsel için)

    const fog       = document.getElementById('fog-effect');
    const input     = document.getElementById('answer-input');
    const bgMusic   = document.getElementById('bg-music');
    const audioUI   = document.getElementById('audio-controls');
    const dots      = document.querySelectorAll('.dot');

    // — MÜZİK —
    bgMusic.volume = 0.3;
    function _tryPlayMusic() {
        if (bgMusic.paused) bgMusic.play().catch(() => {});
    }
    ['mousedown','touchstart','keydown','click'].forEach(e =>
        document.addEventListener(e, _tryPlayMusic)
    );

    // — BASE64 (Türkçe karakter destekli) —
    function _toBase64(str) {
        try { return btoa(unescape(encodeURIComponent(str))); }
        catch(e) { return btoa(str); }
    }

    // — HATA DOTS GÜNCELLE —
    function _updateDots(count) {
        dots.forEach((d, i) => {
            d.classList.toggle('active', i < count);
        });
    }

    // — BUTONLARI TEMIZ BAĞLA (her oda geçişinde) —
    function _bindCheckBtn() {
        const oldCheck = document.getElementById('check-btn');
        const oldNext  = document.getElementById('next-btn');
        const newCheck = oldCheck.cloneNode(true);
        const newNext  = oldNext.cloneNode(true);
        oldCheck.parentNode.replaceChild(newCheck, oldCheck);
        oldNext.parentNode.replaceChild(newNext, oldNext);

        const cb = document.getElementById('check-btn');
        const nb = document.getElementById('next-btn');
        cb.style.display = "block";
        nb.style.display = "none";

        cb.addEventListener('click', function(e) {
            e.preventDefault();
            _tryPlayMusic();

            const val     = input.value.trim().toUpperCase();
            const encoded = _toBase64(val);

            if (encoded === _TENEXAR_DATA.keys[_idx]) {
                // ✅ DOĞRU
                clearInterval(_tmr);
                _off         = Date.now() - _ref;
                _sts[_idx]   = Date.now() - _st;
                _wrongs[_idx] = (_wrongs[_idx] || 0); // son değeri koru
                localStorage.setItem('_tx_s', JSON.stringify(_sts));
                localStorage.setItem('_tx_w', JSON.stringify(_wrongs));
                localStorage.setItem('_tx_wl', JSON.stringify(_wrongLog));

                fog.className = 'fog-green';
                fog.style.opacity = "1";
                setTimeout(() => { fog.style.opacity = "0"; }, 800);

                document.querySelector('.input-area').classList.add('correct-flash');
                setTimeout(() => document.querySelector('.input-area').classList.remove('correct-flash'), 600);

                cb.style.display = "none";
                nb.style.display = "block";
            } else {
                // ❌ YANLIŞ — kaydet
                if (val.length > 0) {
                    _wrongs[_idx] = (_wrongs[_idx] || 0) + 1;
                    _currentWrong = _wrongs[_idx];
                    _wrongLog.push({
                        room: _TENEXAR_DATA.maps[_idx].id,
                        answer: val,
                        ts: Date.now()
                    });
                    localStorage.setItem('_tx_w',  JSON.stringify(_wrongs));
                    localStorage.setItem('_tx_wl', JSON.stringify(_wrongLog));
                    _updateDots(_currentWrong > 5 ? 5 : _currentWrong);
                }

                fog.className = 'fog-red';
                fog.style.opacity = "1";
                setTimeout(() => { fog.style.opacity = "0"; }, 500);

                const pb = document.getElementById('puzzle-box');
                pb.classList.add('shake');
                setTimeout(() => pb.classList.remove('shake'), 400);
            }
        });

        nb.addEventListener('click', function() {
            _idx++;
            localStorage.setItem('_tx_l', _idx);
            _sync();
        });
    }

    // — GERİ —
    document.getElementById('back-btn').addEventListener('click', function() {
        if (_idx > 0) {
            _idx--;
            localStorage.setItem('_tx_l', _idx);
            _sync();
        }
    });

    // — SES İNDİR —
    document.getElementById('p-download').addEventListener('click', function(e) {
        e.stopPropagation();
        const a = document.createElement('a');
        a.href = 'tnxr.wav';
        a.download = 'tnxr.wav';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });

    // — SENKRONIZE —
    function _sync() {
        if (_idx >= _TENEXAR_DATA.maps.length) { _end(); return; }

        input.value = "";
        document.getElementById('level-title').innerText = _TENEXAR_DATA.maps[_idx].id;
        document.getElementById('puzzle-img').src        = _TENEXAR_DATA.maps[_idx].src;

        _bindCheckBtn();

        // Hata dotlarını bu odanın mevcut hatasıyla başlat
        _currentWrong = _wrongs[_idx] || 0;
        _updateDots(_currentWrong > 5 ? 5 : _currentWrong);

        audioUI.style.display = _TENEXAR_DATA.maps[_idx].id === "00.05" ? "block" : "none";

        _st = Date.now();
        _loop();
    }

    function _loop() {
        if (_tmr) clearInterval(_tmr);
        _ref = Date.now() - _off;
        _tmr = setInterval(() => {
            const d = Date.now() - _ref;
            localStorage.setItem('_tx_t', d);
            document.getElementById('clock').innerText = _fmt(d);
        }, 10);
    }

    function _fmt(d) {
        const m  = Math.floor(d / 60000);
        const s  = Math.floor((d % 60000) / 1000);
        const ms = Math.floor((d % 1000) / 10);
        return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}.${ms.toString().padStart(2,'0')}`;
    }

    // — SKOR GÖNDER (yanlış cevaplar dahil) —
    async function _sendScore(total) {
        let user = localStorage.getItem('_tx_u') || prompt("İSİM:") || "Anonim";
        localStorage.setItem('_tx_u', user);
        try {
            await fetch(`${SB_URL}/rest/v1/scores`, {
                method: "POST",
                headers: {
                    "apikey": SB_KEY,
                    "Authorization": `Bearer ${SB_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username:    user,
                    total_time:  total,
                    details:     JSON.stringify(_sts),
                    wrong_counts: JSON.stringify(_wrongs),
                    wrong_answers: JSON.stringify(_wrongLog)
                })
            });
        } catch(e) {}
    }

    // — BİTİŞ EKRANI —
    function _end() {
        if (_tmr) clearInterval(_tmr);
        const totalTime  = document.getElementById('clock').innerText;
        const totalWrong = _wrongs.reduce((a, b) => a + (b || 0), 0);
        _sendScore(totalTime);

        const statsHTML = _sts.map((time, i) => {
            const w = _wrongs[i] || 0;
            return `
            <div class="stat-row">
                <span class="room">${_TENEXAR_DATA.maps[i].id}</span>
                ${w > 0 ? `<span class="mistake-count">${w} hata</span>` : ''}
                <span class="time-val">${_fmt(time)}</span>
            </div>`;
        }).join('');

        document.querySelector('.container').innerHTML = `
            <div class="end-screen">
                <div class="end-title">DEVAM EDECEK</div>
                <div class="end-subtitle">TÜM ODALAR TAMAMLANDI</div>
                <div class="end-time">${totalTime}</div>
                <div class="stats-table">${statsHTML}</div>
                ${totalWrong > 0 ? `<div style="font-size:0.65rem;color:var(--text-dimmer);margin-bottom:16px;letter-spacing:0.15em;">TOPLAM ${totalWrong} YANLIŞ DENEME</div>` : ''}
                <button class="btn-reset" onclick="localStorage.clear();location.reload();">BAŞA DÖN</button>
            </div>
        `;
    }

    _sync();
})();