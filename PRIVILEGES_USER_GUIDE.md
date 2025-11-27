# 权限与角色指南
## 如何同步到此次更新
* 配置`.env`
* 人工把之前的数据库删了，让backend重新初始化

## 有哪些角色
* admin：拥有所有权限，可以在SQL查询界面进行各种操作，包括修改users表
* researcher：拥有对interview, researchers等相关表的 INSERT, UPDATE, DELETE 权限
* analyst：没有写权限
* policy_admin：拥有对policy等相关表的 INSERT, UPDATE, DELETE 权限
* statistician：拥有对指标表的 INSERT, UPDATE, DELETE 权限
* user：没有写权限
* 以上角色均有对所有表(除users)的读权限
* user和analyst的区别在于user无法使用SQL查询页面
* 角色存储与users的role字段，程序遇到非以上枚举的6个角色时应当自动回退为user

## 如何体现这些角色的区别
* 鉴于当前智能查询只支持SELECT语句，我开发了新的页面，名为**SQL查询**，用于体现角色的区别
* SQL查询位于导航栏智能查询右侧，可以输入SQL语句，并从数据库返回结果
* 所有查询都以当前账号对应角色进行
* admin账号可以在此处进行对其他账号的管理，包括修改密码、修改role等，还可以删库跑路
* 注意，若把admin账号的role改成了其他种类，则admin类型账号就丢失了，需要重新初始化，参考`\\backend\\config\\initDb.js`中的`seedAdminUser`

## 如何创建这些角色 (用户层)
* admin账号在初始化时被植入users表，账号名为`admin`，密码由`.env`所配置，初始化后在以此账密登入
* 其余五个角色均可在注册时，于下拉框选择
* 相较于普通角色，其余角色创建时应当输入特殊密码，密码由`.env`配置

## 如何初始化这些角色 (开发者层)
* 参考`.env.example`，数据库角色的创建需要配置密码，初始密码在这里决定
* 在`\\backend\\config\\initDb.js`中，`initPrivileges`与`seedAdminUser`执行初始化的功能，分别对应创建5个角色并赋予对应权限，将admin账号初始化
* 在`initPrivileges`中，可以修改语句来确定初始化时的权限，也可以在使用admin账号登入后，使用`GRANT`语句修改它们的权限
* `initPrivileges`与`seedAdminUser`共同在`initDatabase`中被调用
* 需要注意，现在的`checkDatabaseInitialized`不检查数据库中是否不存在researcher等角色，因此，若出现**数据库已初始化**而**角色未初始化**的情况，`checkDatabaseInitialized`无法发现，可以通过**人工**删除数据库然后再次初始化来修正
* 若出现**数据库未初始化**而**角色已初始化**的情况，在初始化数据库时`initPrivileges`会自动将已有角色删除后重新创建来修正，无需人工

## 实现细节
* `db.js`依据账号的`role`，决定使用哪个pool来执行用户的查询，admin使用root权限
* 只有智能查询和SQL查询会涉及到权限问题，因为其他地方都是预设好的查询，因此其他地方仍旧使用root的权限
* `initPrivileges`确定5个非管理员角色初始化时的权限
* `authService`等增加了检查注册时权限等功能
* 网页上，SQL查询路径为`/sql-query`



## 新增
* 前端显示的账号名不再一直是admin，且不登录看不到上面的一栏
* 优化了账号名的字体显示
* 对普通用户隐藏SQL查询按钮，但是仍可以通过`/sql-query`访问
* 非普通用户角色现在注册需要身份授权码，需要通过`.env`配置
