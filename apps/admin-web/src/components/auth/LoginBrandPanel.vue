<template>
  <section class="relative overflow-hidden bg-gradient-to-br from-[#0b2f5b] via-[#164da3] to-[#3978ef] px-14 py-12 text-white">
    <div class="absolute right-[-10rem] top-[-8rem] h-80 w-80 rounded-full border border-white/10 bg-white/5" />
    <div class="absolute bottom-[-12rem] left-[-8rem] h-96 w-96 rounded-full border border-white/10 bg-white/5" />

    <div class="relative z-1">
      <div class="flex items-center gap-4">
        <div class="h-12 w-12 flex items-center justify-center rounded-3 border border-white/30 bg-white/10 text-xl font-700">
          校
        </div>
        <div>
          <div class="text-lg font-700">校服数字身份</div>
          <div class="mt-1 text-xs tracking-[0.18em] text-blue-100">
            SCHOOL UNIFORM DIGITAL IDENTITY
          </div>
        </div>
      </div>

      <div class="mt-16">
        <span class="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs text-blue-50">
          一衣一码 · 品质可溯 · 正品可信
        </span>
        <h2 class="mb-0 mt-6 max-w-120 text-10 font-700 leading-tight">
          为每一件校服建立<br>
          可信的数字身份证
        </h2>
        <p class="mt-5 max-w-115 text-sm leading-7 text-blue-100">
          连接产品、二维码、生产、检测与品牌数据，让校服从生产到交付的每一个环节清晰可查。
        </p>
      </div>
    </div>

    <svg
      class="absolute bottom-3 right-1 h-[50%] w-[72%]"
      viewBox="0 0 620 410"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="platform" x1="120" y1="230" x2="520" y2="360">
          <stop stop-color="#FFFFFF" stop-opacity=".7" />
          <stop offset="1" stop-color="#8FBBFF" stop-opacity=".16" />
        </linearGradient>
        <linearGradient id="shirt" x1="174" y1="76" x2="344" y2="290">
          <stop stop-color="#FFFFFF" />
          <stop offset="1" stop-color="#D9E8FF" />
        </linearGradient>
        <linearGradient id="navy" x1="338" y1="74" x2="490" y2="294">
          <stop stop-color="#173F82" />
          <stop offset="1" stop-color="#071E47" />
        </linearGradient>
      </defs>
      <ellipse cx="330" cy="340" rx="230" ry="48" fill="url(#platform)" />
      <ellipse cx="330" cy="328" rx="188" ry="35" fill="#DDEBFF" fill-opacity=".45" />
      <ellipse cx="330" cy="318" rx="150" ry="25" fill="#FFFFFF" fill-opacity=".42" />
      <path d="M204 82 155 112l-42 85 52 24 29-52-8 142h154l-8-142 29 52 52-24-42-85-49-30-34 26h-50l-34-26Z" fill="url(#shirt)" stroke="#A8C8F5" stroke-width="3" />
      <path d="m238 108 25 22 25-22-10-31h-30l-10 31Z" fill="#16498D" />
      <path d="M262 130v181" stroke="#BED4F2" stroke-width="3" />
      <path d="M204 82c6 31 24 50 59 50s53-19 59-50" stroke="#16498D" stroke-width="5" />
      <rect x="281" y="150" width="34" height="42" rx="7" fill="#EDF5FF" stroke="#1E5CB4" stroke-width="3" />
      <path d="M291 162h14l4 9-11 12-11-12 4-9Z" fill="#2563EB" />
      <path d="M384 78 338 111l-28 88 46 17 20-49-5 145h134l-5-145 20 49 46-17-28-88-46-33-34 27h-40l-34-27Z" fill="url(#navy)" stroke="#4C7BC0" stroke-width="3" />
      <path d="M418 105h40l34-27-10 73H394l-10-73 34 27Z" fill="#F5F9FF" />
      <path d="M438 105v207" stroke="#5E89C8" stroke-width="3" />
      <path d="M375 172h126" stroke="#77A1DE" stroke-width="5" />
      <path d="M394 151h88" stroke="#E7F1FF" stroke-width="5" />
      <path d="M202 312h63l-8 80h-72l17-80Z" fill="#102F68" />
      <path d="M265 312h63l17 80h-72l-8-80Z" fill="#0A244F" />
      <path d="M385 312h51l-8 80h-59l16-80Z" fill="#071C42" />
      <path d="M436 312h51l16 80h-59l-8-80Z" fill="#061735" />
    </svg>
  </section>
</template>
