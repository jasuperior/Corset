import { Space, Walkable } from "./space.types";

class Reference<T> {
    constructor(public space: Space<T>, public node: Walkable<T>) {}
    to(node: T) {
        let {now} = this.space;
        this.space.point(this.node);
        this.space.after(node);
        this.space.point(now);
    }
    from(node: T) {
        let {now} = this.space;
        this.space.point(this.node);
        this.space.before(node);
        this.space.point(now);
    }
    

}