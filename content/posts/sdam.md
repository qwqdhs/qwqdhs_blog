---
title: "Cartographer建图与nav2导航启动命令流程"
date: 2026-07-21
draft: false
categories: ["技术"]
tags: ["建图", "Cartographer建图", "nav2", "自主导航", "路径规划", "自用", "职业院校技能大赛", "linux", "ubuntu"]
mainSections: ["posts"] 
---

# 命令

1.cd /home/ysc/Desktop/rader

2../LiaderLauch.sh

2../ImuLauch.sh

3.ros2 run robot_state_publisher robot_state_publisher ~/robot.urdf

4.ros2 run cartographer_ros cartographer_node \
    -configuration_directory ~/cartographer_config \ 
    -configuration_basename imu_as_tracking.lua \
    --ros-args -r scan:=/scan -r imu:=/imu/data_raw

6.ros2 run cartographer_ros occupancy_grid_node -resolution 0.05

7.rviz2

8.ros2 run nav2_map_server map_saver_cli -f ~/my_new_map

9.ros2 launch nav2_bringup navigation_launch.py map:=/path/to/your_map.yaml use_sim_time:=False

10.ros2 launch rosbridge_server rosbridge_websocket_launch.xml

## 命令作用与说明

| 命令 | 作用 | 备注 |
|-----------|---------------------------|------|
| cd /home/ysc/Desktop/rader   | 切路径                   | 没什么好说的 |
| ./LiaderLauch.sh   | 启动雷达                   | 启动雷达驱动的脚本 |
| ./ImuLauch.sh     | 启动IMU                   | 启动IMU驱动的脚本 |
| ros2 run robot_state_publisher robot_state_publisher ~/robot.urdf  |    修正雷达朝向以统一建图与导航坐标系               |              通过解析 URDF 模型，将各连杆间的固定关节刚性变换以 tf2_msgs/TFMessage 形式持续广播至 /tf_static 话题，为Cartographer与Nav2栈提供传感器相对于 base_link 的精准外参声明，从而从 TF 树层面统一建图与导航的位姿基准 |
|  ros2 run cartographer_ros cartographer_node （后面省略） |    启动Cartographer建图节点           | 启动建图 |
| ros2 run cartographer_ros occupancy_grid_node -resolution 0.05  |   数据转换                |将 Cartographer 的实时建图数据转换为 0.05 米分辨率的栅格地图，用于 RViz 可视化及 Nav2 路径规划。  |
|  rviz2 |    可视化               | 无 |
| ros2 run nav2_map_server map_saver_cli -f ~/my_new_map  |          保存地图         | 将建图完成后的内容保存 |
| ros2 launch nav2_bringup navigation_launch.py map:=/path/to/your_map.yaml use_sim_time:=False  |     加载地图，并启动Nav2的导航栈              |  其中 use_sim_time:=False 表示使用硬件真实时间（实车模式）|
|ros2 launch rosbridge_server rosbridge_websocket_launch.xml   |     启动 ROS2 WebSocket 通信服务              |在软件上进行控制  |

# 文件路径以及文件说明
### /home/ysc/Desktop/rader:
- **kill.sh**  –杀掉所有建图/路径规划进程
- **ImuLauch.sh** 
- **LidarLauch.sh** 
### /home/:
- **robot.urdf**  -URDF模型(配置)

### /home/cartographer_config
- **Cartographer节点配置文件**

# 后续纯定位模式加载复用
结束当前建图轨迹，锁定数据：

rosservice call /finish_trajectory 0

保存.pbstream文件

rosservice call /write_state "{filename: '/home/ysc/my_new_map.pbstream', include_unfinished_submaps: true}"
