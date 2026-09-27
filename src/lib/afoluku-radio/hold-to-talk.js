// Serialize session setup/teardown. Releasing always closes the mic synchronously,
// including when permission/network work has not completed yet.
export class HoldToTalk {
    actions;
    held = false;
    open = false;
    disposed = false;
    operation = null;
    timer = null;
    constructor(actions) { this.actions = actions; }
    press() {
        if (this.disposed)
            return;
        this.held = true;
        this.cancelTimer();
        if (this.operation)
            return;
        if (this.open) {
            this.actions.gate(true);
            this.actions.change('talking');
            return;
        }
        this.actions.change('starting');
        this.operation = this.actions.start().then(() => {
            this.open = true;
            if (this.held && !this.disposed) {
                this.actions.gate(true);
                this.actions.change('talking');
            }
            else {
                this.actions.gate(false);
                this.scheduleStop();
            }
        }).catch(error => { this.held = false; this.actions.gate(false); this.actions.error(error); this.actions.change('idle'); })
            .finally(() => { this.operation = null; if (this.disposed && this.open)
            void this.end(); });
    }
    release() { if (!this.held && !this.open && !this.operation)
        return; this.held = false; this.actions.gate(false); if (this.open && !this.operation)
        this.scheduleStop(); }
    cancelTimer() { if (this.timer)
        clearTimeout(this.timer); this.timer = null; }
    scheduleStop() {
        this.cancelTimer();
        this.actions.change('draining');
        // Keep transmitting music briefly so the last spoken segment reaches listeners.
        this.timer = setTimeout(() => { this.timer = null; void this.end(); }, 3000);
    }
    async end() {
        if (this.operation || !this.open)
            return;
        this.cancelTimer();
        this.actions.gate(false);
        this.actions.change('stopping');
        this.operation = this.actions.stop().catch(error => this.actions.error(error)).finally(() => {
            this.open = false;
            this.operation = null;
            this.actions.change('idle');
            if (this.held && !this.disposed)
                this.press();
        });
        await this.operation;
    }
    dispose() { this.disposed = true; if (!this.held && !this.open && !this.operation)
        return; this.held = false; this.actions.gate(false); this.cancelTimer(); if (!this.operation)
        void this.end(); }
}
