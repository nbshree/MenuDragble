import React, { useRef } from "react";
import { createDndContext, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

const dndContext = createDndContext(HTML5Backend);
/**
 * React-DnD DndProvide封装
 *
 * @author mingK
 */
export const DndProviderWrapper: React.FC = ({ children }) => {
  const manager = useRef(dndContext);
  return (
    <DndProvider manager={manager.current.dragDropManager!}>
      {children}
    </DndProvider>
  );
};

export default DndProviderWrapper;
