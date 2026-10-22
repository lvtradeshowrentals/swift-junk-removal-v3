// generates src/sections/how.html (dev helper for the how section)
const fs = require('fs'), path = require('path');
const f = n => +n.toFixed(2);
function box(x, y, w, h, d, rot) {
  const t = d * .7;
  const g = `<path class="d f" d="M${x} ${y}h${w}v${h}h${-w}Z"/><path class="d f" d="M${x} ${y}l${d} ${-f(t)}h${w}l${-d} ${f(t)}"/><path class="d f" d="M${x + w} ${y}l${d} ${-f(t)}v${h}l${-d} ${f(t)}"/><path class="d o" d="M${f(x + w / 2)} ${y}v${f(h * .34)}"/><path class="d o" d="M${f(x + w / 2)} ${y}l${d} ${-f(t)}"/><path class="d o" d="M${f(x + w * .22)} ${f(y + h * .62)}h${f(w * .34)}"/>`;
  return `<g class="bx"${rot ? ` transform="rotate(${rot} ${x + w / 2} ${y + h})"` : ''}>${g}</g>`;
}
function tufts(pts) { return pts.map(([x, y]) => `M${x - 3} ${y}h6M${x} ${y - 3}v6`).join(''); }
function pile() {
  return [
    `<path class="d o" d="M0 190H262"/>`,
    `<g class="bx"><path class="d f" d="M2 190V44H66V190Z"/><path class="d f" d="M66 44l8-6V184l-8 6"/><path class="d f" d="M2 44l8-6H74"/></g>`,
    `<g class="bx" transform="rotate(7 18 190)"><path class="d f" d="M18 190V26H90V190Z"/><path class="d f" d="M90 26l9-7V183l-9 7"/><path class="d f" d="M18 26l9-7H99"/><path class="d o" d="M27 36H81V180H27Z"/><path class="d o" d="${tufts([[41, 70], [67, 70], [41, 108], [67, 108], [41, 146], [67, 146]])}"/></g>`,
    box(112, 132, 64, 58, 14), box(190, 146, 50, 44, 12), box(118, 84, 50, 48, 14), box(198, 108, 34, 38, 10), box(124, 46, 38, 38, 10, -3)
  ].join('');
}
const PILE = pile();
// figure (same maths as how.js, standing)
function fig(x) { const hy = 456, sy = 416; return { torso: `M${x - 8} ${sy}H${x + 8}L${x + 6} ${hy}H${x - 6}Z`, body: `M${x - 5} ${hy}L${x - 3} 478L${x - 6} 500M${x + 5} ${hy}L${x + 8} 478L${x + 6} 500M${x} ${sy + 3}L${x - 4} ${sy + 25}L${x - 5} ${sy + 44}M${x} ${sy + 3}L${x + 4} ${sy + 25}L${x + 5} ${sy + 44}`, head: [x, sy - 18] }; }
const fA = fig(84), fB = fig(222);
const CHECK = 'M0 0l5 5 9-10';

const v1 = `
<svg class="hw-svg" id="hw-v1" viewBox="0 0 800 640" data-vbm="164 0 473 640" preserveAspectRatio="xMidYMid meet" focusable="false" aria-hidden="true">
  <defs><clipPath id="hw-c1"><rect x="264" y="50" width="272" height="540"/></clipPath></defs>
  <g class="hw-callouts">
    <g class="k-co1"><path class="l o" d="M70 352H250"/><circle class="l" cx="250" cy="352" r="3.5"/><text class="t mono" x="70" y="340">Photo</text></g>
    <g class="k-co2"><path class="l o" d="M550 286H730"/><circle class="l" cx="550" cy="286" r="3.5"/><text class="t mono" x="730" y="274" text-anchor="end">Details</text></g>
    <g class="k-co3"><path class="l cu" d="M550 392H730"/><circle class="l cu" cx="550" cy="392" r="3.5"/><text class="t mono cu-t" x="730" y="380" text-anchor="end">Sent</text></g>
  </g>
  <path class="l k-phone" d="M266 22H534L550 38V602L534 618H266L250 602V38Z"/>
  <path class="l o k-scr" d="M264 50H536V590H264Z"/>
  <path class="l o k-spk" d="M380 36H420"/><circle class="l o k-spk" cx="440" cy="36" r="3"/>
  <g clip-path="url(#hw-c1)">
    <g class="hw-cam k-cam">
      <path class="l o k-ticks" d="M296 80H504M296 74v12M336 77v6M376 77v6M416 77v6M456 77v6M504 74v12"/>
      <g class="k-pile" transform="translate(292 262) scale(.86)">${PILE}</g>
      <path class="l cu k-scan" d="M282 0H518"/>
      <g class="k-br"><path class="l cu" d="M282 264V236H310"/><path class="l cu" d="M490 236H518V264"/><path class="l cu" d="M518 418V446H490"/><path class="l cu" d="M310 446H282V418"/></g>
      <g class="k-ring"><circle class="l cu" cx="400" cy="341" r="30"/><path class="l cu" d="M400 303v14M400 365v14M362 341h14M424 341h14"/></g>
      <g class="k-shut"><circle class="l" cx="400" cy="540" r="27"/><circle class="k-shin" cx="400" cy="540" r="19" fill="var(--bone)"/></g>
      <rect class="k-flash" x="264" y="50" width="272" height="540" fill="var(--bone)" opacity="0"/>
    </g>
    <g class="hw-thr k-thr">
      <path class="l o k-hl" d="M264 92H536"/>
      <g class="k-pb"><path class="l f" d="M376 116H520V224L508 236H376Z"/><g class="k-pbp" transform="translate(388 128) scale(.46)">${PILE}</g></g>
      <g class="k-dots"><path class="l o" d="M456 256H520V292H468L456 280Z"/><circle class="tx" cx="473" cy="274" r="3"/><circle class="tx" cx="488" cy="274" r="3"/><circle class="tx" cx="503" cy="274" r="3"/></g>
      <g class="k-tb"><path class="l" d="M316 256H520V338L508 350H316Z"/>
        <text class="t body" x="332" y="285">Garage cleanout.</text><text class="t body" x="332" y="308">About ten boxes and</text><text class="t body" x="332" y="331">two mattresses.</text></g>
      <g class="k-sent"><path class="l cu k-tick" transform="translate(436 378)" d="${CHECK}"/><text class="t mono cu-t" x="520" y="378" text-anchor="end">Sent</text></g>
      <path class="l o k-bar" d="M280 548H520V576H280Z"/><path class="l o k-send" d="M498 556l10 6-10 6"/>
    </g>
  </g>
</svg>`;

const v2 = `
<svg class="hw-svg" id="hw-v2" viewBox="0 0 800 640" data-vbm="135 0 530 640" preserveAspectRatio="xMidYMid meet" focusable="false" aria-hidden="true">
  <defs>
    <clipPath id="hw-c2h"><rect class="k-hclip" x="170" y="170" width="460" height="80"/></clipPath>
    <clipPath id="hw-c2a"><rect class="k-aclip" x="178" y="430" width="234" height="52"/></clipPath>
  </defs>
  <g class="k-b1"><path class="l f k-b1p" d="M150 34H547V86H162L150 74Z"/><text class="t body k-b1t" x="170" y="66">Here&#8217;s your price for the garage cleanout.</text></g>
  <path class="l k-card" d="M150 112H636L650 126V502H150Z"/>
  <g class="k-lab"><text class="t mono" x="178" y="148">Your price</text><text class="t mono mute" x="622" y="148" text-anchor="end">Before we lift</text><path class="l o k-div" d="M178 166H622"/></g>
  <g clip-path="url(#hw-c2h)"><text class="t disp k-head" x="178" y="240">Quoted up front</text></g>
  <g class="k-rows">
    <g class="k-r0"><path class="l o k-rl" d="M178 270H622"/><path class="l k-cb" d="M178 285H200V307H178Z"/><path class="l cu k-ck" transform="translate(182.5 297)" d="${CHECK}"/><text class="t body k-rt" x="218" y="302">All lifting and loading</text></g>
    <g class="k-r1"><path class="l o k-rl" d="M178 316H622"/><path class="l k-cb" d="M178 331H200V353H178Z"/><path class="l cu k-ck" transform="translate(182.5 343)" d="${CHECK}"/><text class="t body k-rt" x="218" y="348">Haul-away and disposal</text></g>
    <g class="k-r2"><path class="l o k-rl" d="M178 362H622"/><path class="l k-cb" d="M178 377H200V399H178Z"/><path class="l cu k-ck" transform="translate(182.5 389)" d="${CHECK}"/><text class="t body k-rt" x="218" y="394">Nothing starts until you approve</text><path class="l o k-rl" d="M178 408H622"/></g>
  </g>
  <g class="k-btns">
    <path class="l k-ab" d="M178 430H398L412 456L398 482H178Z"/>
    <g clip-path="url(#hw-c2a)"><path class="k-fill" d="M178 430H398L412 456L398 482H178Z" fill="var(--copper)"/></g>
    <text class="t mono btn-t k-t1" x="200" y="461">Approve</text>
    <g class="k-t2"><path class="l k-tick2" transform="translate(200 457)" d="${CHECK}" style="stroke:var(--ink)"/><text class="t mono btn-t ink-t" x="226" y="461">Approved</text></g>
    <path class="l o k-ask" d="M436 430H622V482H436Z"/><text class="t mono mute k-askt" x="529" y="461" text-anchor="middle">Ask a question</text>
    <circle class="l cu k-tap" cx="290" cy="456" r="30"/>
  </g>
  <g class="k-b2"><path class="l f k-b2p" d="M150 536H468V588H162L150 576Z"/><text class="t body k-b2t" x="170" y="568">Booked. Your crew is on the way.</text></g>
</svg>`;

const wheel = (cx, cy, r, cls) => `<g class="${cls}"><circle class="l d f" cx="${cx}" cy="${cy}" r="${r}"/><circle class="l o d" cx="${cx}" cy="${cy}" r="${f(r * .5)}"/><path class="l o k-spoke" d="M${f(cx - r * .5)} ${cy}H${f(cx + r * .5)}"/></g>`;
const v3 = `
<svg class="hw-svg" id="hw-v3" viewBox="0 0 800 640" data-vb="20 190 760 430" data-vbm="20 250 760 360" preserveAspectRatio="xMidYMid meet" focusable="false" aria-hidden="true">
  <g class="k-sky"><path class="l sk f" d="M-60 500V390H10V500"/><path class="l sk2 k-skw" d="M-54 406H4M-54 426H4M-54 446H4M-54 466H4M-54 486H4"/><path class="l sk f" d="M16 500V350H64V500"/><path class="l sk2 k-skw" d="M22 366H58M22 386H58M22 406H58M22 426H58M22 446H58M22 466H58M22 486H58"/><path class="l sk f" d="M70 500V404H110V500"/><path class="l sk2 k-skw" d="M76 420H104M76 440H104M76 460H104M76 480H104"/><path class="l sk f" d="M116 500V300H180V500"/><path class="l sk2 k-skw" d="M122 316H174M122 336H174M122 356H174M122 376H174M122 396H174M122 416H174M122 436H174M122 456H174M122 476H174"/><path class="l sk f" d="M190 500V380H226V500"/><path class="l sk2 k-skw" d="M196 396H220M196 416H220M196 436H220M196 456H220M196 476H220"/><path class="l sk f" d="M290 500V360H342V500"/><path class="l sk2 k-skw" d="M296 376H336M296 396H336M296 416H336M296 436H336M296 456H336M296 476H336"/><path class="l sk f" d="M352 500V268H392V500"/><path class="l sk2 k-skw" d="M358 284H386M358 304H386M358 324H386M358 344H386M358 364H386M358 384H386M358 404H386M358 424H386M358 444H386M358 464H386M358 484H386"/><path class="l sk f" d="M398 500V390H456V500"/><path class="l sk2 k-skw" d="M404 406H450M404 426H450M404 446H450M404 466H450M404 486H450"/><path class="l sk f" d="M470 500V330H516V500"/><path class="l sk2 k-skw" d="M476 346H510M476 366H510M476 386H510M476 406H510M476 426H510M476 446H510M476 466H510M476 486H510"/><path class="l sk f" d="M528 500V374H594V500"/><path class="l sk2 k-skw" d="M534 390H588M534 410H588M534 430H588M534 450H588M534 470H588"/><path class="l sk f" d="M610 500V294H650V500"/><path class="l sk2 k-skw" d="M616 310H644M616 330H644M616 350H644M616 370H644M616 390H644M616 410H644M616 430H644M616 450H644M616 470H644"/><path class="l sk f" d="M656 500V382H712V500"/><path class="l sk2 k-skw" d="M662 398H706M662 418H706M662 438H706M662 458H706M662 478H706"/><path class="l sk f" d="M720 500V340H790V500"/><path class="l sk2 k-skw" d="M726 356H784M726 376H784M726 396H784M726 416H784M726 436H784M726 456H784M726 476H784"/><path class="l sk f" d="M800 500V400H850V500"/><path class="l sk2 k-skw" d="M806 416H844M806 436H844M806 456H844M806 476H844"/></g>
  <path class="l o k-r1" d="M0 526H800"/>
  <path class="l o k-lane" d="M0 556H800" stroke-dasharray="26 22"/>
  <path class="l o k-r2" d="M0 594H800" style="stroke-opacity:.16"/>
  <path class="l k-ground" d="M0 500H800"/>
  <path class="l o k-ticks" d="M0 500v10M20 500v5M40 500v5M60 500v5M80 500v5M100 500v10M120 500v5M140 500v5M160 500v5M180 500v5M200 500v10M220 500v5M240 500v5M260 500v5M280 500v5M300 500v10M320 500v5M340 500v5M360 500v5M380 500v5M400 500v10M420 500v5M440 500v5M460 500v5M480 500v5M500 500v10M520 500v5M540 500v5M560 500v5M580 500v5M600 500v10M620 500v5M640 500v5M660 500v5M680 500v5M700 500v10M720 500v5M740 500v5M760 500v5M780 500v5M800 500v10"/>
  <g class="k-truck">
    <g class="k-load">
      <g class="k-couch" transform="translate(340 454)"><path class="l f" d="M-48 -54H48V-26H-48Z"/><path class="l f" d="M-58 -38H-44V0H-58Z"/><path class="l f" d="M44 -38H58V0H44Z"/><path class="l f" d="M-44 -26H44V-8H-44Z"/><path class="l o" d="M0 -54V-26M-22 -26V-8M22 -26V-8"/><path class="l o" d="M-54 0v4M54 0v4"/></g>
      <g class="k-box" transform="translate(258 454)"><path class="l f" d="M-17 0h34v-30h-34Z"/><path class="l o" d="M0 -30v12M-17 -14h34"/></g>
    </g>
    <g class="k-trailer">
      ${wheel(325, 480, 20, 'k-w k-tw')}
      <path class="l d f" d="M230 454H420V462H230Z"/>
      <path class="l d f" d="M232 442H418V454H232Z"/>
      <path class="l o d" d="M263 442V454M294 442V454M325 442V454M356 442V454M387 442V454"/>
      <path class="l d" d="M420 458L452 462"/>
    </g>
    <g class="k-straps"><path class="l cu k-s1" d="M300 454V400"/><path class="l cu k-s2" d="M374 454V400"/></g>
    <g class="k-pick">
      <path class="l d f" d="M452 468V446H456V428H586L590 402L600 386H660L694 424L700 432L752 438L758 444V462L748 468H726A28 28 0 0 0 674 468H526A28 28 0 0 0 474 468Z"/>
      <path class="l o d" d="M606 396H654L682 422H606Z"/>
      <path class="l o d" d="M456 438H586M590 426H702M598 426V466M648 426V466M634 438h10M748 440h8M452 452h4"/>
      ${wheel(500, 478, 22, 'k-w k-pw')}${wheel(700, 478, 22, 'k-w k-pw')}
    </g>
  </g>
  <g class="k-fig k-figA"><path class="l f k-ft" d="${fA.torso}"/><path class="l k-fb" d="${fA.body}"/><circle class="l f k-fh" cx="${fA.head[0]}" cy="${fA.head[1]}" r="7"/></g>
  <g class="k-fig k-figB"><path class="l f k-ft" d="${fB.torso}"/><path class="l k-fb" d="${fB.body}"/><circle class="l f k-fh" cx="${fB.head[0]}" cy="${fB.head[1]}" r="7"/></g>
  <g class="k-done"><circle class="l cu" cx="540" cy="420" r="40"/><path class="l cu k-dtick" transform="translate(524.5 423)" d="M0 0l9 9 22-24"/></g>
</svg>`;

const hud = (n, t) => `<div class="how-hud" aria-hidden="true"><span class="mono hud-a">Fig. 0${n}</span><span class="mono hud-b">${t}</span><span class="hud-bar"><i></i></span><span class="mono hud-c">0${n} <em>/</em> 03</span></div><i class="hc a"></i><i class="hc b"></i><i class="hc c"></i><i class="hc d"></i>`;
const arrow = '<svg aria-hidden="true"><use href="#i-arrow"/></svg>';
const html = `<section class="sec on-bone how" id="how" aria-labelledby="how-h">
  <div class="wrap how-head">
    <div class="how-hl">
      <p class="eyebrow" data-r><b>/</b>The process</p>
      <h2 class="h2 split" id="how-h">How it works.</h2>
    </div>
    <p class="lede" data-r style="--d:.08s">Three steps, and the only one you do is the first.</p>
  </div>

  <div class="how-track" id="howTrack">
    <div class="how-pin" id="howPin">
      <div class="wrap how-stage">
        <div class="how-rail" aria-hidden="true">
          <i class="how-spine"><b></b></i>
          <span class="how-rn" data-i="0"><span>1</span><i class="how-node"></i></span>
          <span class="how-rn" data-i="1"><span>2</span><i class="how-node"></i></span>
          <span class="how-rn" data-i="2"><span>3</span><i class="how-node"></i></span>
        </div>
        <ol class="how-steps">
          <li class="how-step" data-i="0">
            <i class="how-trace" aria-hidden="true"></i>
            <span class="how-n" aria-hidden="true">1</span>
            <div class="how-copy">
              <p class="mono how-tag" aria-hidden="true">Step 01</p>
              <h3>Tell us what&#8217;s going</h3>
              <p>Send a few details and a photo, or give us a call. It takes a couple of minutes.</p>
              <a class="btn btn--ink btn--sm how-cta" href="#quote" data-service="general">Start your quote <svg aria-hidden="true"><use href="#i-arrow"/></svg></a>
            </div>
            <figure class="how-art" data-fig="1" aria-hidden="true"><div class="how-in">${hud(1, 'Tell us what&#8217;s going')}${v1}</div><i class="how-edge"></i></figure>
          </li>
          <li class="how-step" data-i="1">
            <i class="how-trace" aria-hidden="true"></i>
            <span class="how-n" aria-hidden="true">2</span>
            <div class="how-copy">
              <p class="mono how-tag" aria-hidden="true">Step 02</p>
              <h3>Get your price</h3>
              <p>We reply with a price. You approve it before we start, so there are no surprises.</p>
              <a class="link how-link" href="#faq">How pricing works ${arrow}</a>
            </div>
            <figure class="how-art" data-fig="2" aria-hidden="true"><div class="how-in">${hud(2, 'Get your price')}${v2}</div><i class="how-edge"></i></figure>
          </li>
          <li class="how-step" data-i="2">
            <i class="how-trace" aria-hidden="true"></i>
            <span class="how-n" aria-hidden="true">3</span>
            <div class="how-copy">
              <p class="mono how-tag" aria-hidden="true">Step 03</p>
              <h3>We haul it away</h3>
              <p>Our crew arrives, does all the lifting, and takes everything with us. You don&#8217;t lift a thing.</p>
              <a class="link how-link" href="#proof">See the difference ${arrow}</a>
            </div>
            <figure class="how-art" data-fig="3" aria-hidden="true"><div class="how-in">${hud(3, 'We haul it away')}${v3}</div><i class="how-edge"></i></figure>
          </li>
        </ol>
      </div>
    </div>
  </div>
</section>
`;
fs.writeFileSync(path.join(__dirname, '..', '..', 'src', 'sections', 'how.html'), html);
console.log('how.html', html.length);
