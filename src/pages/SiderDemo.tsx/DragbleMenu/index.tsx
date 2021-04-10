import React, { createContext, useRef, useState, useContext } from "react";
import { Menu, SubMenuProps } from "antd";
import { useDrag, useDrop } from "react-dnd";
import {
  DesktopOutlined,
  PieChartOutlined,
  FileOutlined,
  TeamOutlined,
  UserOutlined
} from "@ant-design/icons";
import { MenuItemProps } from "antd/lib/menu/MenuItem";
import { flatMapDeep, flattenDeep, isNil, isNumber } from "lodash";
import DndProvider from "../DndProvider";
import update from "immutability-helper";
import styles from "./index.less";

interface CtxProps {
  sort?: (dragId: string, hoverId: string) => void;
}

const Ctx = createContext<CtxProps>({});

const { SubMenu } = Menu;

interface ItemType {
  key: string;
  icon?: React.ReactNode;
  title: string;
  children?: ItemType[];
}

const useSort = ({ id }: { id: string }) => {
  const { sort } = useContext(Ctx);
  const [{ isDragging }, drag] = useDrag({
    item: { type: "menuItem", key: id },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging()
    })
  });

  const [{ isOver }, drop] = useDrop({
    accept: "menuItem",
    drop: (item: any) => {
      if (sort && id && isOver) {
        sort(item.key, id);
      }
    },
    collect: monitor => ({
      isOver: monitor.isOver({ shallow: true })
    })
  });

  return {
    drag,
    drop,
    isOver,
    isDragging
  };
};

function DragMenuItem(props: MenuItemProps) {
  const ref = useRef<any>(null);

  const { drag, drop, isOver, isDragging } = useSort({
    id: props.eventKey as string
  });
  drag(drop(ref));
  const divStyle: any = {};
  if (isOver) {
    divStyle.background = "red";
  }
  if (isDragging) {
    divStyle.opacity = "0.2";
  }
  return (
    <div ref={ref} style={divStyle}>
      <Menu.Item {...props}>{props.title}</Menu.Item>
    </div>
  );
}

function DragSubMenu(props: MenuItemProps) {
  const ref = useRef<any>(null);

  // const { drag, drop, isOver, isDragging } = useSort({
  //   id: props.eventKey as string,
  // });
  const [{ isDragging }, drag] = useDrag({
    item: { type: "menuItem", key: props.eventKey as string },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging()
    })
  });
  const [{ isOver }, drop] = useDrop({
    accept: "menuItem",
    drop: (item: any) => {
      // if (sort && id && isOver) {
      //   sort(item.key, id);
      // }
    },
    collect: monitor => ({
      isOver: monitor.isOver({ shallow: true })
    })
  });
  drag(drop(ref));
  const divStyle: any = {};
  if (isOver) {
    divStyle.background = "red";
  }
  if (isDragging) {
    divStyle.opacity = "0.2";
  }
  return (
    <div ref={ref} style={divStyle}>
      <SubMenu {...props}></SubMenu>
    </div>
  );
}

const DragbleMenu: React.FC = () => {
  const [list, setList] = useState<ItemType[]>([
    {
      key: "1",
      icon: <PieChartOutlined />,
      title: "Option 1"
    },
    {
      key: "2",
      icon: <DesktopOutlined />,
      title: "Option 2"
    },
    {
      key: "sub1",
      icon: <UserOutlined />,
      title: "User",
      children: [
        {
          key: "3",
          title: "Tom"
        },
        {
          key: "4",
          title: "Bill"
        },
        {
          key: "5",
          title: "Alex"
        }
      ]
    },
    {
      key: "sub2",
      icon: <TeamOutlined />,
      title: "Team",
      children: [
        {
          key: "6",
          title: "Team 1"
        },
        {
          key: "8",
          title: "Team 2"
        }
      ]
    },
    {
      key: "9",
      icon: <FileOutlined />,
      title: "Files"
    }
  ]);

  const getPosition = (id: string) => {
    let p: { index: number; innerIndex?: number } | undefined;

    list.some((item, index) => {
      if (item.key === id) {
        p = {
          index: index
        };
        return true;
      }

      if (item.children) {
        const innerIndex = item.children.findIndex(child => child.key === id);
        if (innerIndex > -1) {
          p = {
            index: index,
            innerIndex: innerIndex
          };
        }
      }
      return !!p;
    });
    return p;
  };

  const sort = (dragId: string, hoverId: string) => {
    if (dragId === hoverId) {
      return;
    }

    const dragPosition = getPosition(dragId);
    console.log(dragId);
    console.log(dragPosition);
    const dropPosition = getPosition(hoverId);
    console.log(hoverId);
    console.log(dropPosition);

    // 一级间的sort
    if (
      dragPosition &&
      dropPosition &&
      isNumber(dragPosition.index) &&
      isNumber(dropPosition.index) &&
      isNil(dragPosition.innerIndex) &&
      isNil(dropPosition.innerIndex)
    ) {
      console.log("一级间的sort");
      const dragItem = list[dragPosition.index];
      const updatedList = update(list, {
        $splice: [
          [dragPosition.index, 1],
          [dropPosition.index, 0, dragItem]
        ]
      });
      setList(updatedList);
      return;
    }

    // 同一个文件夹下拖拽
    if (
      dragPosition &&
      dropPosition &&
      isNumber(dragPosition.index) &&
      isNumber(dropPosition.index) &&
      isNumber(dragPosition.innerIndex) &&
      isNumber(dropPosition.innerIndex) &&
      dragPosition.index === dropPosition.index
    ) {
      console.log("同一个文件夹下拖拽");
      const dragItem = list[dragPosition.index].children![
        dragPosition.innerIndex
      ];
      const updatedList = update(list, {
        [dragPosition.index]: {
          children: {
            $splice: [
              [dragPosition.innerIndex, 1],
              [dropPosition.innerIndex, 0, dragItem]
            ]
          }
        }
      });
      setList(updatedList);
      return;
    }

    // 不同文件夹下拖拽
    if (
      dragPosition &&
      dropPosition &&
      isNumber(dragPosition.index) &&
      isNumber(dropPosition.index) &&
      isNumber(dragPosition.innerIndex) &&
      isNumber(dropPosition.innerIndex) &&
      dragPosition.index !== dropPosition.index
    ) {
      console.log("不同文件夹下拖拽");
      const dragItem = list[dragPosition.index].children![
        dragPosition.innerIndex
      ];
      const updatedList = update(list, {
        [dragPosition.index]: {
          children: {
            $splice: [[dragPosition.innerIndex, 1]]
          }
        },
        [dropPosition.index]: {
          children: {
            $splice: [[dropPosition.innerIndex, 0, dragItem]]
          }
        }
      });
      setList(updatedList);
      return;
    }

    // 文件夹内拖至外部一级
    if (
      dragPosition &&
      dropPosition &&
      isNumber(dragPosition.index) &&
      isNumber(dropPosition.index) &&
      isNumber(dragPosition.innerIndex) &&
      !isNumber(dropPosition.innerIndex)
    ) {
      console.log("文件夹内拖至外部一级");
      const dragItem = list[dragPosition.index].children![
        dragPosition.innerIndex
      ];
      const updatedList = update(list, {
        [dragPosition.index]: {
          children: {
            $splice: [[dragPosition.innerIndex, 1]]
          }
        },
        $splice: [[dropPosition.index, 0, dragItem]]
      });
      setList(updatedList);
      return;
    }

    // 文件夹外一级·拖至内部
    if (
      dragPosition &&
      dropPosition &&
      isNumber(dragPosition.index) &&
      isNumber(dropPosition.index) &&
      !isNumber(dragPosition.innerIndex) &&
      isNumber(dropPosition.innerIndex)
    ) {
      console.log("文件夹外一级·拖至内部");
      const dragItem = list[dragPosition.index];
      const updatedList = update(list, {
        $splice: [[dragPosition.index, 1]],
        [dropPosition.index]: {
          children: {
            $splice: [[dropPosition.innerIndex, 0, dragItem]]
          }
        }
      });
      setList(updatedList);
      return;
    }
  };

  return (
    <DndProvider>
      <Ctx.Provider value={{ sort: sort }}>
        <Menu
          theme="dark"
          defaultSelectedKeys={["1"]}
          mode="inline"
          className={styles.main}
        >
          {list.map(item => {
            if (item.children?.length) {
              return (
                <DragSubMenu key={item.key} icon={item.icon} title={item.title}>
                  {item.children.map(child => (
                    <DragMenuItem
                      key={child.key}
                      icon={child.icon}
                      title={child.title}
                    />
                  ))}
                </DragSubMenu>
              );
            } else {
              return (
                <DragMenuItem
                  key={item.key}
                  icon={item.icon}
                  title={item.title}
                />
              );
            }
          })}
        </Menu>
      </Ctx.Provider>
    </DndProvider>
  );
};

export default DragbleMenu;
