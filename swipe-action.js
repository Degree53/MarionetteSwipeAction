/**
 * Provides swipe action behavior to an existing view.
 * This can be used for swipe based interactions such as
 * swipe to delete.
 *
 * Events triggered:
 *
 *  - swipe:left
 *    Called when the user starts swiping left.
 *
 *  - swipe:right
 *    Called when the user starts swiping right.

 *  - swipe:reset
 *    Called when a user cancels or completes a swipe.
 *
 *  - swipe:cancelled
 *    Called when a swipe action is cancelled after it has started.
 *
 *  - swipe:complete
 *    Called when a swipe action is completed.
 *
 * @author Karl Purkhardt
 * @date 14/07/2015
 */
var SwipeActionBehavior = Marionette.Behavior.extend({

    defaults: {

        /**
         * Css selector for identifying the swipe target.  Leave blank to apply to entire view.
         */
        targetElement: '',

        /**
         * Specifies the number of pixels the user must swipe for the action to register
         */
        swipeDepth: 45,

        /**
         * Specifies whether the user can drag/swipe to the left
         */
        enableSwipeLeft: true,

        /**
         * Specifies whether the user can drag/swipe to the right
         */
        enableSwipeRight: true
    },

    /**
     * Determines if the action has been completed
     */
    complete: false,

    /**
     * Determines if their has been any dragging - used in drag end to ensure it's a valid dragend
     */
    dragged: false,

    onRender: function() {
        this.hammer = new Hammer(this.getDragTargetElement().get(0));
        this.hammer.on("pan", this.__onDrag.bind(this));
        this.hammer.on("panend", this.__onDragEnd.bind(this));
    },

    /**
     * Returns the element that is the target of drag events
     */
    getDragTargetElement: function() {
        var selector = this.options.targetElement;
        if (selector.length) {
            return this.view.$el.find(selector);
        }
        return this.$el;
    },

    /**
     * Determines if the swipe/drag direction is allowed.
     */
    directionAllowed: function(e) {
        var direction = e.direction;

        if (this.dragged) {
            return true;
        }

        if (this.options.enableSwipeLeft && direction === Hammer.DIRECTION_LEFT) {
            return true;
        }

        if (this.options.enableSwipeRight && direction === Hammer.DIRECTION_RIGHT) {
            return true;
        }

        return false;
    },

    /**
     * Called when the user drags/swipes the view.
     */
    __onDrag: function(e) {

        // Don't allow a drag event if the action has already completed
        if (this.complete) {
            return;
        }

        // Make sure the swipe direction is allowed
        if (!this.directionAllowed(e)) {
            return;
        }

        // Mark this view as dragged - allowing drag end to fire when we finish dragging
        this.dragged = true;

        // Grab the swipe direction
        var direction = e.direction;

        // Trigger a drag event
        this.triggerMethod('drag', e);

        // If the direction hasn't changed we have nothing to do
        if (this.direction === direction) {
            return;
        }

        // If the user changed direction, allow it, but don't change the recorded direction
        // as this is used on panend to determine what action to perform.  If a user starts
        // swiping left, it's a left swipe regardless of whether they change their mind.
        if (this.direction) {
            return;
        }

        // Update the direction
        this.direction = direction;

        // Trigger a swipe event on the view that implements this behavior
        if (this.direction === Hammer.DIRECTION_LEFT) {
            this.view.triggerMethod('swipe:left');
        }
        else if (this.direction === Hammer.DIRECTION_RIGHT) {
            this.view.triggerMethod('swipe:right');
        }
    },

    /**
     * Called when the user has finished dragging.
     */
    __onDragEnd: function(e) {

        // Don't allow the drag end event if this action has already completed
        if (this.complete) {
            return;
        }

        // Make sure the user dragged/swipped the view.
        if (!this.dragged) {
            return;
        }

        // Trigger a dragend event
        this.triggerMethod('dragend', e);

        // See if the user dragged far enough for this to count as an action
        if (!this.hasDraggedFarEnough(e.deltaX)) {
            this.cancelAction(this.getDragTargetElement());
        }
        else {
            this.completeAction(this.getDragTargetElement());
        }
    },

    /**
     * Reset state based properties.  Called when a drag is cancelled or completes.
     */
    __reset: function($el) {
        this.direction = null;
        this.dragged = false;
        this.triggerMethod('swipe:reset', $el);
    },

    /**
     * Determines if the user has dragged/swiped far enough to count as a valid action.
     */
    hasDraggedFarEnough: function(deltaX) {
        if (this.direction === Hammer.DIRECTION_LEFT) {
            return deltaX < -this.options.swipeDepth;
        }
        return deltaX > this.options.swipeDepth;
    },

    /**
     * Called when the user doesn't drag/swipe far enough.
     */
    cancelAction: function($el) {
        this.view.triggerMethod('swipe:cancelled');
        this.__reset($el);
    },

    /**
     * Called when the user completes a successful drag/swipe
     */
    completeAction: function($el) {
        this.complete = true;
        this.view.triggerMethod('swipe:complete');
        this.__reset($el);
    },

    onDestroy: function() {
        this.hammer.destroy();
    }
});
