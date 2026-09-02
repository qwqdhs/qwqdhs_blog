// 生成示例图片 - 多色块组合,便于演示选择性调色
// 返回 dataURL

export function generateSampleImage(width = 800, height = 600): string {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // 天空(蓝色渐变)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.6);
  skyGrad.addColorStop(0, "#2A6DF4"); // 深蓝
  skyGrad.addColorStop(1, "#7BB3FF"); // 浅蓝
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height * 0.6);

  // 太阳(黄色)
  ctx.fillStyle = "#FFD400";
  ctx.beginPath();
  ctx.arc(width * 0.78, height * 0.18, 50, 0, Math.PI * 2);
  ctx.fill();

  // 太阳光晕
  const sunGlow = ctx.createRadialGradient(
    width * 0.78, height * 0.18, 20,
    width * 0.78, height * 0.18, 100
  );
  sunGlow.addColorStop(0, "rgba(255, 212, 0, 0.6)");
  sunGlow.addColorStop(1, "rgba(255, 212, 0, 0)");
  ctx.fillStyle = sunGlow;
  ctx.beginPath();
  ctx.arc(width * 0.78, height * 0.18, 100, 0, Math.PI * 2);
  ctx.fill();

  // 草地(绿色渐变)
  const grassGrad = ctx.createLinearGradient(0, height * 0.6, 0, height);
  grassGrad.addColorStop(0, "#3FAE3F");
  grassGrad.addColorStop(1, "#1F7A1F");
  ctx.fillStyle = grassGrad;
  ctx.fillRect(0, height * 0.6, width, height * 0.4);

  // 远山(深绿)
  ctx.fillStyle = "#1F5F3F";
  ctx.beginPath();
  ctx.moveTo(0, height * 0.6);
  ctx.lineTo(width * 0.25, height * 0.45);
  ctx.lineTo(width * 0.5, height * 0.6);
  ctx.lineTo(width * 0.75, height * 0.42);
  ctx.lineTo(width, height * 0.6);
  ctx.lineTo(width, height * 0.65);
  ctx.lineTo(0, height * 0.65);
  ctx.closePath();
  ctx.fill();

  // 红色花朵
  const flowers = [
    { x: 0.15, y: 0.85 },
    { x: 0.35, y: 0.92 },
    { x: 0.55, y: 0.82 },
    { x: 0.85, y: 0.9 },
    { x: 0.25, y: 0.95 },
    { x: 0.7, y: 0.95 },
  ];
  flowers.forEach(({ x, y }) => {
    const cx = width * x;
    const cy = height * y;
    // 花瓣(红色)
    ctx.fillStyle = "#E63946";
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5;
      ctx.beginPath();
      ctx.arc(
        cx + Math.cos(angle) * 10,
        cy + Math.sin(angle) * 10,
        8,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    // 花心(黄色)
    ctx.fillStyle = "#FFD400";
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  // 白云
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  const clouds = [
    { x: 0.2, y: 0.2, r: 25 },
    { x: 0.25, y: 0.22, r: 20 },
    { x: 0.18, y: 0.22, r: 18 },
    { x: 0.5, y: 0.15, r: 22 },
    { x: 0.55, y: 0.17, r: 18 },
  ];
  clouds.forEach(({ x, y, r }) => {
    ctx.beginPath();
    ctx.arc(width * x, height * y, r, 0, Math.PI * 2);
    ctx.fill();
  });

  // 加点彩色噪点,让颜色范围更丰富
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 12;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  return canvas.toDataURL("image/png");
}
