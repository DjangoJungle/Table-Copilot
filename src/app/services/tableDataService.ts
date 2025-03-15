// 表格数据服务，用于管理表格数据的存储和检索
import { TableData } from '../types';

// 检查是否在浏览器环境中
const isBrowser = typeof window !== 'undefined';

// 表格数据存储
class TableDataService {
  private tables: Record<string, any[]> = {};
  private listeners: Map<string, Set<(data: any[]) => void>>;
  private readonly STORAGE_KEY = 'table_copilot_tables';

  constructor() {
    this.listeners = new Map();

    // 从localStorage加载数据或初始化示例数据
    this.loadFromStorage();
  }

  // 从localStorage加载数据
  private loadFromStorage(): void {
    try {
      if (isBrowser) {
        // 浏览器环境，使用localStorage
        const storedData = localStorage.getItem(this.STORAGE_KEY);
        if (storedData) {
          this.tables = JSON.parse(storedData);
          console.log('从浏览器存储加载了表格数据');
        } else {
          // 如果没有存储数据，初始化示例数据
          this.initSampleData();
          // 保存到localStorage
          this.saveToStorage();
        }
      } else {
        // 服务器环境，只初始化示例数据，不使用localStorage
        this.initSampleData();
        console.log('服务器环境，初始化示例数据');
      }
    } catch (error) {
      console.error('从浏览器存储加载数据失败:', error);
      // 出错时使用示例数据
      this.initSampleData();
    }
  }

  // 保存数据到localStorage
  private saveToStorage(): void {
    if (typeof window === 'undefined') {
      return; // 服务器端不保存
    }
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.tables));
      
      // 触发storage事件，通知其他组件数据已更新
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
      }
    } catch (error) {
      console.error('保存到localStorage失败:', error);
    }
  }

  // 初始化示例数据
  private initSampleData() {
    // 学生表
    const students = [
      { student_id: 1, name: "张三", gender: "男", age: 20, department: "计算机科学", enrollment_year: 2020 },
      { student_id: 2, name: "李四", gender: "女", age: 21, department: "数学", enrollment_year: 2019 },
      { student_id: 3, name: "王五", gender: "男", age: 22, department: "物理", enrollment_year: 2018 },
      { student_id: 4, name: "赵六", gender: "女", age: 20, department: "化学", enrollment_year: 2020 },
      { student_id: 5, name: "钱七", gender: "男", age: 19, department: "计算机科学", enrollment_year: 2021 },
      { student_id: 6, name: "孙八", gender: "女", age: 22, department: "数学", enrollment_year: 2019 },
      { student_id: 7, name: "周九", gender: "男", age: 21, department: "物理", enrollment_year: 2020 },
      { student_id: 8, name: "吴十", gender: "女", age: 20, department: "化学", enrollment_year: 2020 }
    ];
    
    // 课程表
    const courses = [
      { course_id: "CS101", course_name: "计算机导论", credit: 3, department: "计算机科学", teacher_id: 1 },
      { course_id: "CS102", course_name: "数据结构", credit: 4, department: "计算机科学", teacher_id: 1 },
      { course_id: "MATH101", course_name: "高等数学", credit: 5, department: "数学", teacher_id: 2 },
      { course_id: "MATH102", course_name: "线性代数", credit: 3, department: "数学", teacher_id: 2 },
      { course_id: "PHY101", course_name: "大学物理", credit: 4, department: "物理", teacher_id: 3 },
      { course_id: "CHEM101", course_name: "普通化学", credit: 3, department: "化学", teacher_id: 4 }
    ];
    
    // 成绩表
    const grades = [
      { student_id: 1, course_id: "CS101", score: 85, semester: "2020-1" },
      { student_id: 1, course_id: "CS102", score: 92, semester: "2020-2" },
      { student_id: 1, course_id: "MATH101", score: 78, semester: "2020-1" },
      { student_id: 2, course_id: "MATH101", score: 95, semester: "2019-1" },
      { student_id: 2, course_id: "MATH102", score: 88, semester: "2019-2" },
      { student_id: 3, course_id: "PHY101", score: 76, semester: "2018-1" },
      { student_id: 4, course_id: "CHEM101", score: 82, semester: "2020-1" },
      { student_id: 5, course_id: "CS101", score: 79, semester: "2021-1" },
      { student_id: 6, course_id: "MATH102", score: 94, semester: "2019-2" },
      { student_id: 7, course_id: "PHY101", score: 85, semester: "2020-1" },
      { student_id: 8, course_id: "CHEM101", score: 90, semester: "2020-1" }
    ];
    
    // 教师表
    const teachers = [
      { teacher_id: 1, name: "张教授", department: "计算机科学", title: "教授", age: 45 },
      { teacher_id: 2, name: "李教授", department: "数学", title: "副教授", age: 40 },
      { teacher_id: 3, name: "王教授", department: "物理", title: "教授", age: 50 },
      { teacher_id: 4, name: "赵教授", department: "化学", title: "讲师", age: 35 }
    ];
    
    // 部门表
    const departments = [
      { department_id: 1, department_name: "计算机科学", building: "信息楼", budget: 1000000 },
      { department_id: 2, department_name: "数学", building: "理科楼A", budget: 800000 },
      { department_id: 3, department_name: "物理", building: "理科楼B", budget: 900000 },
      { department_id: 4, department_name: "化学", building: "理科楼C", budget: 850000 }
    ];
    
    // 保存示例数据
    this.tables["students"] = students;
    this.tables["courses"] = courses;
    this.tables["grades"] = grades;
    this.tables["teachers"] = teachers;
    this.tables["departments"] = departments;
  }

  // 获取所有表格名称
  getAllTableNames(): string[] {
    return Object.keys(this.tables);
  }

  // 获取表格数据
  getTableData(tableName: string): any[] | null {
    return this.tables[tableName] || null;
  }

  // 获取所有表格数据
  getAllTables(): Record<string, any[]> {
    const result: Record<string, any[]> = {};
    Object.entries(this.tables).forEach(([key, value]) => {
      result[key] = [...value];
    });
    return result;
  }

  // 直接设置表格数据（用于服务器端同步客户端数据）
  setTableDataDirect(tableName: string, data: any[]): void {
    this.tables[tableName] = [...data];
    // 不调用saveToStorage，不触发事件
  }

  // 更新表格数据
  updateTableData(tableName: string, data: any[]): void {
    this.tables[tableName] = [...data];
    this.saveToStorage(); // 保存到localStorage
    this.notifyListeners(tableName);
  }

  // 添加新表格
  addTable(tableName: string, data: any[]): void {
    if (this.tables.hasOwnProperty(tableName)) {
      throw new Error(`表格 ${tableName} 已存在`);
    }
    this.tables[tableName] = [...data];
    this.saveToStorage(); // 保存到localStorage
    this.notifyListeners(tableName);
  }

  // 保存为新表格
  saveAsNewTable(originalTableName: string, newTableName: string, data: any[]): void {
    if (this.tables.hasOwnProperty(newTableName)) {
      throw new Error(`表格 ${newTableName} 已存在`);
    }
    this.tables[newTableName] = [...data];
    this.saveToStorage(); // 保存到localStorage
    this.notifyListeners(newTableName);
  }

  // 删除表格
  deleteTable(tableName: string): boolean {
    const result = this.tables.hasOwnProperty(tableName);
    if (result) {
      delete this.tables[tableName];
      this.saveToStorage(); // 保存到localStorage
      this.notifyListeners(tableName);
    }
    return result;
  }

  // 添加监听器
  addListener(tableName: string, listener: (data: any[]) => void): () => void {
    if (!this.listeners.has(tableName)) {
      this.listeners.set(tableName, new Set());
    }
    this.listeners.get(tableName)!.add(listener);

    // 返回取消监听的函数
    return () => {
      const tableListeners = this.listeners.get(tableName);
      if (tableListeners) {
        tableListeners.delete(listener);
      }
    };
  }

  // 通知监听器
  private notifyListeners(tableName: string): void {
    const tableListeners = this.listeners.get(tableName);
    const data = this.tables[tableName] || [];
    
    if (tableListeners) {
      tableListeners.forEach(listener => listener([...data]));
    }
  }

  // 清除所有数据（用于测试）
  clearAllData(): void {
    this.tables = {};
    
    if (isBrowser) {
      localStorage.removeItem(this.STORAGE_KEY);
    }
    
    console.log('已清除所有表格数据');
  }
}

// 创建单例实例
const tableDataService = new TableDataService();

export default tableDataService; 