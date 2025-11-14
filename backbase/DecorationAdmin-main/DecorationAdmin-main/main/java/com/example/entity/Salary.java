package com.example.entity;

import com.baomidou.mybatisplus.extension.activerecord.Model;
import lombok.Data;

@Data
public class Salary extends Model<Salary> {
    //员工id
    private long id;
    //员工姓名
    private String name;
    //出勤天数
    private Integer days;
    //基本工资
    private Integer basicsalary;
    //工资卡号
    private String cardid;
    //业务提成
    private Integer commisson;
    //全勤奖
    private float attendence;
    //罚款
    private float fine;
    //代扣个税
    private float tax;
    //代扣养老保险
    private float endowmentInsurance;
    //代扣医疗保险
    private float medicalInsurance;
    //代扣失业保险
    private float unemploymentInsurance;
    //代扣住房公积金
    private float HousingProvidentFund;
    //应发工资
    private float salary;
    //实发工资
    private float finalsalary;
}
