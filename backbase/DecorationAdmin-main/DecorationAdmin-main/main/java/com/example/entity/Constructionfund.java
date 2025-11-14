package com.example.entity;

import lombok.Data;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.extension.activerecord.Model;
import com.baomidou.mybatisplus.annotation.TableId;


@Data
@TableName("constructionfund")
public class Constructionfund extends Model<Constructionfund> {
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
      * 项目代码 
      */
    private Integer projectid;

    /**
      * 增减金额 
      */
    private Integer money;

    /**
      * 增减内容 
      */
    private String content;

    /**
      * 备用 
      */
    private String name;

}