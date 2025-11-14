package com.example.entity;

import lombok.Data;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.extension.activerecord.Model;
import com.baomidou.mybatisplus.annotation.TableId;


@Data
@TableName("commission")
public class Commission extends Model<Commission> {
    /**
      * 主键
      */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
      * 日期 
      */
    private String date;

    /**
      * 提成 
      */
    private Integer money;

    private String name;

    /**
      * 员工id 
      */
    private Integer staffid;

}