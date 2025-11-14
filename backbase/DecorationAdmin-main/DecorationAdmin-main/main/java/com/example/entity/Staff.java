package com.example.entity;

import lombok.Data;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.extension.activerecord.Model;
import com.baomidou.mybatisplus.annotation.TableId;


@Data
@TableName("staff")
public class Staff extends Model<Staff> {
    /**
      * 主键
      */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
      * 基本工资 
      */
    private Integer basicsalary;

    /**
      * 生日 
      */
    private String birth;

    /**
      * 工资卡号 
      */
    private String card;

    /**
      * 员工姓名 
      */
    private String name;

    /**
      * 联系方式 
      */
    private String phone;

    /**
      * 性别 
      */
    private String sex;

}