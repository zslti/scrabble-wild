import React from 'react';
import {useDroppable} from '@dnd-kit/core';

interface Props{
  id: any;
  children: React.ReactNode;
  type?: string;
  disabled?: boolean;
}

export function DndDroppable(props: Props) {
  const {isOver, setNodeRef} = useDroppable({
    id: props.id,
  });
  const style: React.CSSProperties = {
    opacity: isOver ? 1 : 0.7,
    position: props.type == 'tile' ? 'absolute' : undefined,
    left: props.type == 'tile' ? `${(parseInt(props.id.toString().split('-')[0]) * 3.25)}rem` : undefined,
    top: props.type == 'tile' ? `${(parseInt(props.id.toString().split('-')[1]) * 3.25)}rem` : undefined,
    width: props.type == 'tile' ? (props.disabled? '0' : '3.25rem') : undefined,
    height: props.type == 'tile' ? '3.25rem' : undefined,
    transition: 'opacity .3s',
  };
  return (
    <div ref={setNodeRef} style={style}>
      {props.children}
    </div>
  );
}
  