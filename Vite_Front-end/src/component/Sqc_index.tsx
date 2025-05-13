import React, { useRef, useEffect, useCallback, useState } from 'react';

const TOTAL_FRAMES = 150; // 根据实际帧数调整
const FPS = 60; // 帧率
const PRELOAD_COUNT = 30; // 预加载帧数

const SqcIndex: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameCache = useRef<Map<number, HTMLImageElement>>(new Map());
  const currentFrame = useRef(1);
  const animationId = useRef<number | null>(null);
  const isLoading = useRef(false);

  // xiong.webp 相关
  const xiongImgRef = useRef<HTMLImageElement | null>(null);
  const xiongLoaded = useRef(false);
  // 记录当前xiong的绘制区域
  const xiongRectRef = useRef<{x: number, y: number, w: number, h: number} | null>(null);

  // 动画暂停/播放状态
  const [paused, setPaused] = useState(false);

  // 加载单帧图片
  const loadFrame = useCallback((frameNumber: number): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = `/frame_webp/frame_${String(frameNumber).padStart(4, '0')}.webp`;
    });
  }, []);

  // 预加载后续帧
  const preloadFrames = useCallback(async (startFrame: number) => {
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
  }, [loadFrame]);

  // 绘制当前帧并叠加 xiong.webp
  const drawFrame = useCallback(async (frameNumber: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let img = frameCache.current.get(frameNumber);
    if (!img) {
      try {
        img = await loadFrame(frameNumber);
        frameCache.current.set(frameNumber, img);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Error loading frame ${frameNumber}:`, error);
        return;
      }
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // 叠加绘制 xiong.webp
    if (xiongLoaded.current && xiongImgRef.current) {
      const progress = (frameNumber - 1) / (TOTAL_FRAMES - 1); // 0~1
      const canvasW = canvas.width;
      const canvasH = canvas.height;
      const startX = -canvasW * 0.3;
      const endX = canvasW * 1.1;
      const x = startX + (endX - startX) * progress;
      const y = canvasH / 2;
      const rotateY = Math.PI * progress; // 0~π
      const scale = 0.5 + 0.5 * Math.abs(Math.cos(rotateY)); // 0.5~1
      const imgW = (canvasW / 4) * scale;
      const imgH = (canvasH / 4) * scale;
      // 记录当前xiong的绘制区域（用于点击检测，未考虑旋转）
      xiongRectRef.current = { x: x - imgW / 2, y: y - imgH / 2, w: imgW, h: imgH };
      ctx.save();
      ctx.translate(x, y);
      const safeScaleX = Math.max(Math.abs(Math.cos(rotateY)), 0.05) * (Math.cos(rotateY) >= 0 ? 1 : -1);
      ctx.transform(safeScaleX, 0, 0, 1, 0, 0);
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
  }, [loadFrame]);

  // 动画主循环
  const animate = useCallback(async () => {
    if (paused) return;
    if (currentFrame.current > TOTAL_FRAMES) {
      currentFrame.current = 1; // 循环播放
    }
    await drawFrame(currentFrame.current);
    preloadFrames(currentFrame.current + 1);
    currentFrame.current++;
    animationId.current = window.requestAnimationFrame(() => {
      setTimeout(() => animate(), 1000 / FPS);
    });
  }, [drawFrame, preloadFrames, paused]);

  // 启动动画和加载 xiong.webp
  useEffect(() => {
    currentFrame.current = 1;
    frameCache.current.clear();
    animate();
    preloadFrames(1);
    // 加载 xiong.webp
    const xiongImg = new window.Image();
    xiongImg.onload = () => {
      xiongImgRef.current = xiongImg;
      xiongLoaded.current = true;
    };
    xiongImg.src = '/xiong.webp';
    return () => {
      if (animationId.current) {
        window.cancelAnimationFrame(animationId.current);
        animationId.current = null;
      }
      frameCache.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  // 点击canvas检测是否点中xiong.webp
  useEffect(() => {
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
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('click', handleClick);
    }
    return () => {
      if (canvas) {
        canvas.removeEventListener('click', handleClick);
      }
    };
  }, []);

  return (
    <div className="animation-container" style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <canvas ref={canvasRef} width={1080} height={1080} style={{ maxWidth: '100%', height: 'auto' }} />
    </div>
  );
};

export default SqcIndex;
