// Prepare for heatmap data.
// Temporary solution, better to put in backend.

import { EventType, fullSnapshotEvent, IncrementalSource, MouseInteractions, type eventWithTime, type incrementalSnapshotEvent } from '@rrweb/types';
import { SystemInfo } from './sdk';

const LOGIN_CLICK_TYPE = [
    MouseInteractions.Click,
    MouseInteractions.DblClick,
    MouseInteractions.TouchEnd,
]

const heatmapStill = (systemInfo: SystemInfo | null, events: eventWithTime[] = []) => {

    // Filter out the events that are not of mouse events
    const mouseEvents: incrementalSnapshotEvent[] = [];
    events.forEach((event: eventWithTime) => {
        if (event.type === EventType.IncrementalSnapshot) {
            mouseEvents.push(event);
        };
    });


    // Filter out the data in mouse events that are not of mouse click
    const clickEvents: Array<{ x: number, y: number }> = [];
    mouseEvents.forEach((event: incrementalSnapshotEvent) => {
        if (event.data.source === IncrementalSource.MouseInteraction && LOGIN_CLICK_TYPE.includes(event.data.type)) {
            const click = {
                x: event.data.x || 0,
                y: event.data.y || 0,
            }
            clickEvents.push(click);
        };
    });

    // Filter out the screeshot events
    const screenshotEvents: fullSnapshotEvent[] = [];
    events.forEach((event: eventWithTime) => {
        if (event.type === EventType.FullSnapshot) {
            screenshotEvents.push(event);
        };
    });

    // console.log('clickEvents', clickEvents);
    // console.log('screenshotEvents', screenshotEvents);

    const heatmapPayload = {
        systemInfo: systemInfo,
        clickEvents: JSON.stringify(clickEvents),
        screenshotEvents: JSON.stringify(screenshotEvents),
    }

    return heatmapPayload;
}

export default heatmapStill;