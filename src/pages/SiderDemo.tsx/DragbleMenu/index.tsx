import React, {
  createContext,
  useRef,
  useState,
  useContext,
  Dispatch,
  SetStateAction
} from "react";
import { Menu, SubMenuProps } from "antd";
import { DropTargetMonitor, useDrag, useDrop, XYCoord } from "react-dnd";
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
  setOpenKeys?: Dispatch<SetStateAction<string[]>>;
}

const Ctx = createContext<CtxProps>({});

const { SubMenu } = Menu;

interface ItemType {
  key: string;
  icon?: React.ReactNode;
  title: string;
  type: "form" | "group";
  children?: ItemType[];
}

const useSort = ({ id }: { id: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { sort, setOpenKeys } = useContext(Ctx);
  const [{ isDragging }, drag] = useDrag({
    item: { type: "menuItem", key: id },
    // begin: () => {
    //   setOpenKeys && setOpenKeys([]);
    // },
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
    isDragging,
    ref
  };
};

function DragMenuItem(props: MenuItemProps) {
  const { drag, drop, isOver, isDragging, ref } = useSort({
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
  const { drag, drop, isOver, isDragging, ref } = useSort({
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
      <SubMenu {...props} />
    </div>
  );
}

const DragbleMenu: React.FC = () => {
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [list, setList] = useState<ItemType[]>([
    {
      key: "1",
      icon: <PieChartOutlined />,
      type: "form",
      title: "Option 1"
    },
    {
      key: "2",
      icon: <DesktopOutlined />,
      type: "form",
      title: "Option 2"
    },
    {
      key: "sub1",
      icon: <UserOutlined />,
      type: "group",
      title: "group1",
      children: [
        {
          key: "3",
          type: "form",
          title: "Tom"
        },
        {
          key: "4",
          icon: <DesktopOutlined />,
          type: "form",
          title: "Bill"
        },
        {
          key: "5",
          type: "form",
          title: "Alex"
        }
      ]
    },
    {
      key: "sub2",
      icon: <TeamOutlined />,
      type: "group",
      title: "group2",
      children: [
        {
          key: "6",
          type: "form",
          title: "Team 1"
        },
        {
          key: "8",
          type: "form",
          title: "Team 2"
        }
      ]
    },
    {
      key: "9",
      icon: <FileOutlined />,
      type: "group",
      title: "group3"
    }
  ]);

  const getPosition = (id: string) => {
    let p: { index: number; innerIndex?: number; data: ItemType } | undefined;

    list.some((item, index) => {
      if (item.key === id) {
        p = {
          index: index,
          data: item
        };
        return true;
      }

      if (item.children) {
        const innerIndex = item.children.findIndex(child => child.key === id);
        if (innerIndex > -1) {
          p = {
            index: index,
            innerIndex: innerIndex,
            data: item.children.find(child => child.key === id)!
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
    // if (dragPosition?.data?.type === "group") {
    //   setOpenKeys([]);
    // }
    const dropPosition = getPosition(hoverId);
    console.log(hoverId);
    console.log(dropPosition);

    if (
      dragPosition?.data.type !== "group" &&
      dropPosition?.data.type === "group" &&
      isNumber(dragPosition?.index) &&
      !isNumber(dragPosition?.innerIndex)
    ) {
      if (
        dropPosition?.data.children &&
        dropPosition?.data.children.length > 0
      ) {
        return;
      }
      const updatedList = update(list, {
        $splice: [[dragPosition?.index || 0, 1]],
        [dropPosition.index]: {
          children: {
            $apply: (v: any) => {
              return [dragPosition?.data, ...(v || [])];
            }
          }
        }
      });
      setList(updatedList);
      return;
    }

    if (
      dragPosition?.data.type === "group" &&
      dropPosition?.data.type !== "group" &&
      isNumber(dropPosition?.innerIndex)
    ) {
      return;
    }

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
        dragPosition.innerIndex || 0
      ];
      const updatedList = update(list, {
        [dragPosition.index]: {
          children: {
            $splice: [
              [dragPosition.innerIndex || 0, 1],
              [dropPosition.innerIndex || 0, 0, dragItem]
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
        dragPosition.innerIndex || 0
      ];
      const updatedList = update(list, {
        [dragPosition.index]: {
          children: {
            $splice: [[dragPosition.innerIndex || 0, 1]]
          }
        },
        [dropPosition.index]: {
          children: {
            $splice: [[dropPosition.innerIndex || 0, 0, dragItem]]
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
        dragPosition.innerIndex || 0
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
      <Ctx.Provider value={{ sort, setOpenKeys }}>
        <Menu
          theme="dark"
          // openKeys={openKeys}
          // defaultSelectedKeys={["1"]}
          mode="inline"
          className={styles.main}
          // onOpenChange={(keys: React.Key[]) => {
          //   setOpenKeys(keys.map(item => item.toString()));
          // }}
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
