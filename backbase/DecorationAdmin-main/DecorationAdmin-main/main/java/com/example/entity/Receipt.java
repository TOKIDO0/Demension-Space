package com.example.entity;

import lombok.Data;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.extension.activerecord.Model;
import com.baomidou.mybatisplus.annotation.TableId;


@Data
@TableName("receipt")
public class Receipt extends Model<Receipt> {
    /**
      * 主键
      */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
      * 收款日期 
      */
    private String date;

    /**
      * 收款金额 
      */
    private Integer money;

    /**
      * 备用 
      */
    private String name;

    /**
      * 项目代码 
      */
    private Integer projectid;

}