<template>
  <div class="animation-container">
    <canvas ref="canvas" width="1080" height="1080"></canvas>
  </div>
</template>

<script>
export default {
  name: 'SqcIndex',
  data() {
    return {
      canvas: null,
      ctx: null,
      currentFrame: 0,
      totalFrames: 0,
      frameCache: new Map(), // 用于缓存已加载的图片
      isLoading: false,
      animationId: null,
      fps: 30, // 帧率
      preloadCount: 5, // 预加载的帧数
    }
  },
  mounted() {
    this.initCanvas()
    this.startAnimation()
  },
  beforeUnmount() {
    this.stopAnimation()
  },
  methods: {
    initCanvas() {
      this.canvas = this.$refs.canvas
      this.ctx = this.canvas.getContext('2d')
    },
    
    async startAnimation() {
      // 获取总帧数（这里假设帧数从1开始，到某个最大值）
      this.totalFrames = 150 // 根据实际帧数调整
      this.currentFrame = 1
      
      // 开始动画循环
      this.animate()
      
      // 预加载初始帧
      await this.preloadFrames(1)
    },
    
    async animate() {
      if (this.currentFrame > this.totalFrames) {
        this.currentFrame = 1 // 循环播放
      }
      
      // 绘制当前帧
      await this.drawFrame(this.currentFrame)
      
      // 预加载后续帧
      this.preloadFrames(this.currentFrame + 1)
      
      // 更新帧计数
      this.currentFrame++
      
      // 继续下一帧
      this.animationId = requestAnimationFrame(() => {
        setTimeout(() => this.animate(), 1000 / this.fps)
      })
    },
    
    async drawFrame(frameNumber) {
      // 如果帧已经在缓存中，直接使用
      if (this.frameCache.has(frameNumber)) {
        const img = this.frameCache.get(frameNumber)
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.ctx.drawImage(img, 0, 0)
        return
      }
      
      // 如果帧不在缓存中，加载它
      try {
        const img = await this.loadFrame(frameNumber)
        this.frameCache.set(frameNumber, img)
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.ctx.drawImage(img, 0, 0)
      } catch (error) {
        console.error(`Error loading frame ${frameNumber}:`, error)
      }
    },
    
    async preloadFrames(startFrame) {
      if (this.isLoading) return
      this.isLoading = true
      
      try {
        const promises = []
        for (let i = 0; i < this.preloadCount; i++) {
          const frameNumber = startFrame + i
          if (frameNumber <= this.totalFrames && !this.frameCache.has(frameNumber)) {
            promises.push(this.loadFrame(frameNumber))
          }
        }
        
        const images = await Promise.all(promises)
        images.forEach((img, index) => {
          const frameNumber = startFrame + index
          this.frameCache.set(frameNumber, img)
        })
      } catch (error) {
        console.error('Error preloading frames:', error)
      } finally {
        this.isLoading = false
      }
    },
    
    loadFrame(frameNumber) {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        // 使用 webp 格式的图片
        img.src = `/frame_webp/frame_${String(frameNumber).padStart(4, '0')}.webp`
      })
    },
    
    stopAnimation() {
      if (this.animationId) {
        cancelAnimationFrame(this.animationId)
        this.animationId = null
      }
      this.frameCache.clear()
    }
  }
}
</script>

<style scoped>
.animation-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

canvas {
  max-width: 100%;
  height: auto;
}
</style> 