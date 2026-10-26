/* Browser/WebAssembly platform layer (Emscripten): the page owns the canvas (render_wgpu.c replays
 * frames there), input and audio come in through exported functions. */
#ifdef __EMSCRIPTEN__
#include "render.h"
#include "win32.h"

int g_window_w = 1024, g_window_h = 768;

int window_create(const char *title) { (void)title; return 0; }   /* 0: run headless */
void window_event_loop(void) {}


void watch_arm(uint32_t addr) { (void)addr; }   /* write watchpoints need signals: native debugging only */

/* ---- memory diagnostics (RC_LOG): where the wasm memory goes, and how deep the host stacks really get.
 * rc_stack_poison() fills the calling thread's unused stack with a pattern; rc_stack_used() later scans
 * for the deepest overwrite, i.e. that thread's stack high-water mark so far. */
#include <emscripten/heap.h>
#include <emscripten/stack.h>
#include <malloc.h>
#include <string.h>
static __thread uintptr_t t_poison_lo, t_poison_base;
void rc_stack_poison(void) {
    uintptr_t end = emscripten_stack_get_end(), cur = emscripten_stack_get_current();
    if (cur <= end + 16384) return;
    t_poison_lo = end; t_poison_base = emscripten_stack_get_base();
    memset((void *)end, 0xA5, cur - 16384 - end);
}
uint32_t rc_stack_used(void) {
    if (!t_poison_lo) return 0;
    const uint64_t *w = (const uint64_t *)t_poison_lo, *top = (const uint64_t *)t_poison_base;
    while (w < top && *w == 0xA5A5A5A5A5A5A5A5ull) w++;
    return (uint32_t)(t_poison_base - (uintptr_t)w);
}
void rc_mem_report(const char *who, uint32_t frame) {
    extern void guest_mem_stats(uint32_t *heap_used, uint32_t *valloc_used);
    uint32_t hu, vu; guest_mem_stats(&hu, &vu);
    struct mallinfo mi = mallinfo();
    fprintf(stderr, "[mem] %s f%u wasm=%zuMB malloc arena=%uMB used=%uMB guest heap=%uMB valloc=%uMB stack(%s)=%uKB\n",
            who, frame, emscripten_get_heap_size() >> 20, (unsigned)mi.arena >> 20, (unsigned)mi.uordblks >> 20,
            hu >> 20, vu >> 20, who, rc_stack_used() >> 10);
}
#endif
