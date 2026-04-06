(function() {
    const SB_URL = "https://vovgbyecufjtizvsdtpj.supabase.co"; 
    const SB_KEY = "sb_publishable_mCC1vz5bXw2qbWoozoIfgQ__5t7AQWe"; 

    let _idx = parseInt(localStorage.getItem('_tx_l')) || 0;
    let _off = parseInt(localStorage.getItem('_tx_t')) || 0;
    let _sts = JSON.parse(localStorage.getItem('_tx_s')) || [];
    let _wrongs = JSON.parse(localStorage.getItem('_tx_w')) || [];
    let _wrongLog = JSON.parse(localStorage.getItem('_tx_wl')) || [];
    let _ref, _tmr, _st;

    const fog = document.getElementById('fog-effect');
    const input = document.getElementById('answer-input');
    const checkBtn = document.getElementById('check-btn');
    const nextBtn = document.getElementById('next-btn');
    const bgMusic = document.getElementById('bg-music');
    const audioUI = document.getElementById('audio-controls');

    function _sync() {
        if(_idx >= _TENEXAR_DATA.maps.length) { _end(); return; }
        checkBtn.style.display = "block";
        nextBtn.style.display = "none";
        input.value = "";
        document.getElementById('level-title').innerText = _TENEXAR_DATA.maps[_idx].id;
        document.getElementById('puzzle-img').src = _TENEXAR_DATA.maps[_idx].src;
        audioUI.style.display = _TENEXAR_DATA.maps[_idx].id === "00.05" ? "flex" : "none";
        _st = Date.now();
        _loop();
    }

    checkBtn.addEventListener('click', function(e) {
        let val = input.value.trim().toUpperCase(); 
        let encoded = btoa(unescape(encodeURIComponent(val)));

        if(encoded === _TENEXAR_DATA.keys[_idx]) {
            clearInterval(_tmr);
            _off = Date.now() - _ref;
            _sts[_idx] = Date.now() - _st;
            localStorage.setItem('_tx_s', JSON.stringify(_sts));
            fog.className = 'fog-green';
            fog.style.opacity = "1";
            setTimeout(() => fog.style.opacity = "0", 800);
            checkBtn.style.display = "none";
            nextBtn.style.display = "block";
        } else {
            if(val.length > 0) {
                _wrongs[_idx] = (_wrongs[_idx] || 0) + 1;
                _wrongLog.push({ room: _TENEXAR_DATA.maps[_idx].id, answer: val, time: _fmt(Date.now() - _st) });
                localStorage.setItem('_tx_w', JSON.stringify(_wrongs));
                localStorage.setItem('_tx_wl', JSON.stringify(_wrongLog));
            }
            fog.className = 'fog-red';
            fog.style.opacity = "1";
            setTimeout(() => fog.style.opacity = "0", 500);
        }
    });

    nextBtn.addEventListener('click', () => { _idx++; localStorage.setItem('_tx_l', _idx); _sync(); });
    document.getElementById('back-btn').onclick = () => { if(_idx > 0) { _idx--; localStorage.setItem('_tx_l', _idx); _sync(); } };
    document.getElementById('p-download').onclick = () => { window.open('tnxr.wav', '_blank'); };

    function _loop() {
        if(_tmr) clearInterval(_tmr);
        _ref = Date.now() - _off;
        _tmr = setInterval(() => {
            let d = Date.now() - _ref;
            localStorage.setItem('_tx_t', d);
            document.getElementById('clock').innerText = _fmt(d);
        }, 10);
    }

    function _fmt(d) {
        let m = Math.floor(d/60000), s = Math.floor((d%60000)/1000), ms = Math.floor((d%1000)/10);
        return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}.${ms.toString().padStart(2,'0')}`;
    }

    async function _sendScore(total) {
        let user = localStorage.getItem('_tx_u') || prompt("İsim:") || "Anonim";
        localStorage.setItem('_tx_u', user);
        try {
            await fetch(`${SB_URL}/rest/v1/scores`, {
                method: "POST",
                headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({ username: user, total_time: total, details: JSON.stringify(_sts), wrong_answers: JSON.stringify(_wrongLog) })
            });
        } catch (e) {}
    }

    function _end() {
        if(_tmr) clearInterval(_tmr);
        let totalTime = document.getElementById('clock').innerText;
        _sendScore(totalTime);
        document.querySelector('.container').innerHTML = `<div style="height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; background:var(--surface);">
            <h1 style="letter-spacing:10px; color:#fff;">DEVAM EDECEK</h1>
            <div style="font-size:3rem; color:var(--accent); margin:20px 0;">${totalTime}</div>
            <button onclick="localStorage.clear();location.reload();" class="btn-rect" style="background:var(--accent); color:white; padding:15px 40px; border:none; cursor:pointer; font-family:var(--mono);">BAŞA DÖN</button>
        </div>`;
    }

    _sync();
    window.addEventListener('click', () => { if(bgMusic.paused) { bgMusic.volume = 0.15; bgMusic.play(); } }, { once: true });
})();