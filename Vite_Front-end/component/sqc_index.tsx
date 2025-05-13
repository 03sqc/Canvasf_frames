import React, { useRef, useEffect, useState } from 'react';

const TOTAL_FRAMES = 150;
const FPS = 30;
const PRELOAD_COUNT = 5;
const BASE_WIDTH = 1080;
const BASE_HEIGHT = 1080;

const SqcIndex: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameCache = useRef<Map<number, HTMLImageElement>>(new Map());
  const currentFrame = useRef(1);
  const animationId = useRef<number | null>(null);
  const isLoading = useRef(false);

  // xiong.webp 相关
  const xiongImgRef = useRef<HTMLImageElement | null>(null);
  const xiongLoaded = useRef(false);
  const xiongRectRef = useRef<{x: number, y: number, w: number, h: number} | null>(null);

  const [paused, setPaused] = useState(false);

  // 动态调整 Canvas 分辨率和样式尺寸
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const container = canvas.parentElement;
    if (!container) return;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    let scale = Math.min(containerWidth / BASE_WIDTH, containerHeight / BASE_HEIGHT);
    if (!isFinite(scale) || scale <= 0) scale = 1;
    canvas.width = Math.round(BASE_WIDTH * scale);
    canvas.height = Math.round(BASE_HEIGHT * scale);
    canvas.style.width = `${Math.round(BASE_WIDTH * scale)}px`;
    canvas.style.height = `${Math.round(BASE_HEIGHT * scale)}px`;
  };

  // 加载单帧图片
  const loadFrame = (frameNumber: number): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = `/frame_webp/frame_${String(frameNumber).padStart(4, '0')}.webp`;
    });
  };

  // 预加载后续帧
  const preloadFrames = async (startFrame: number) => {
    if (isLoading.current) return;
    isLoading.current = true;
    try {
      const promises: Promise<HTMLImageElement>[] = [];
      for (let i = 0; i < PRELOAD_COUNT; i++) {
        const frameNumber = startFrame + i;
        if (frameNumber <= TOTAL_FRAMES && !frameCache.current.has(frameNumber)) {
          promises.push(loadFrame(frameNumber));
        }
      }
      const images = await Promise.all(promises);
      images.forEach((img, index) => {
        const frameNumber = startFrame + index;
        frameCache.current.set(frameNumber, img);
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error preloading frames:', error);
    } finally {
      isLoading.current = false;
    }
  };

  // 绘制当前帧（如果未加载则跳过该帧）
  const drawFrame = (frameNumber: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = frameCache.current.get(frameNumber);
    if (!img) {
      // 跳过未加载的帧
      return false;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // 绘制 xiong.webp
    if (xiongLoaded.current && xiongImgRef.current) {
      const progress = (frameNumber - 1) / (TOTAL_FRAMES - 1);
      const startX = -canvas.width * 0.3;
      const endX = canvas.width * 1.1;
      const x = startX + (endX - startX) * progress;
      const y = canvas.height / 2;
      const rotateY = Math.PI * progress;
      const scale = 0.5 + 0.5 * Math.abs(Math.cos(rotateY));
      const imgW = (canvas.width / 4) * scale;
      const imgH = (canvas.height / 4) * scale;
      xiongRectRef.current = { x: x - imgW / 2, y: y - imgH / 2, w: imgW, h: imgH };
      ctx.save();
      ctx.translate(x, y);
      ctx.transform(Math.cos(rotateY), 0, 0, 1, 0, 0);
      ctx.drawImage(
        xiongImgRef.current,
        -imgW / 2,
        -imgH / 2,
        imgW,
        imgH
      );
      ctx.restore();
    } else {
      xiongRectRef.current = null;
    }
  };

  // 动画主循环（彻底唯一化）
  function animate() {
    if (paused) {
      animationId.current = null;
      return;
    }
    if (currentFrame.current > TOTAL_FRAMES) {
      currentFrame.current = 1;
    }
    drawFrame(currentFrame.current);
    preloadFrames(currentFrame.current + 1);
    currentFrame.current++;
    animationId.current = window.requestAnimationFrame(animate);
  }

  // 只在挂载时启动一次动画主循环
  useEffect(() => {
    currentFrame.current = 1;
    frameCache.current.clear();
    resizeCanvas();
    if (animationId.current) {
      window.cancelAnimationFrame(animationId.current);
      animationId.current = null;
    }
    animationId.current = window.requestAnimationFrame(animate);
    preloadFrames(1);

    // 加载 xiong.webp
    const xiongImg = new window.Image();
    xiongImg.onload = () => {
      xiongImgRef.current = xiongImg;
      xiongLoaded.current = true;
    };
    xiongImg.src = '/xiong.webp';

    // 绑定点击事件
    const handleClick = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas || !xiongRectRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const { x, y, w, h } = xiongRectRef.current;
      if (
        clickX >= x && clickX <= x + w &&
        clickY >= y && clickY <= y + h
      ) {
        setPaused(p => !p);
      }
    };
    if (canvasRef.current) {
      canvasRef.current.addEventListener('click', handleClick);
    }
    window.addEventListener('resize', resizeCanvas);

    return () => {
      if (animationId.current) {
        window.cancelAnimationFrame(animationId.current);
        animationId.current = null;
      }
      frameCache.current.clear();
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('click', handleClick);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // paused 状态变化时，彻底 cancel/恢复动画主循环
  useEffect(() => {
    if (paused) {
      if (animationId.current) {
        window.cancelAnimationFrame(animationId.current);
        animationId.current = null;
      }
    } else {
      if (!animationId.current) {
        animationId.current = window.requestAnimationFrame(animate);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  return (
    <div className="animation-container" style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <canvas ref={canvasRef} style={{ maxWidth: '100%', height: 'auto' }} />
    </div>
  );
};

export default SqcIndex;